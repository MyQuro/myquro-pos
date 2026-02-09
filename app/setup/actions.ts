"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { organization } from "@/db/schema";
import { organizationCompliance } from "@/db/schema";
import { organizationOwner } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

type SetupOrganizationInput = {
    businessName: string;
    address: string;
    city: string;
    ownerName: string;
    phoneNumber: string;
    fssaiType: "BASIC" | "STATE" | "CENTRAL";
    fssaiNumber: string;
    gstin?: string;
};

export async function submitSetupOrganization(input: SetupOrganizationInput) {

    // TODO: Auth Guard
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        redirect("/login");
    }
    const userId = session.user.id;
    // TODO: Duplicate submission guard
    const existing = await db
    .select({
      orgId: organizationOwner.organizationId,
    })
    .from(organizationOwner)
    .where(eq(organizationOwner.userId, userId))
    .limit(1);
    
    if (existing.length > 0) {
    redirect("/pending");
  }
    // TODO: Create organization
    const orgId = randomUUID();
    await db.insert(organization).values({
        id: orgId,
        name: input.businessName,
        address: input.address,
        city: input.city,
        status: "PENDING",
    });
    // TODO: Link organization to owner
    await db.insert(organizationOwner).values({
        id: randomUUID(),
        organizationId: orgId,
        userId: userId,
        ownerName: input.ownerName,
        countryCode: "+91",
        phone: input.phoneNumber,
    });
    // TODO: Link organization to compliance
    await db.insert(organizationCompliance).values({
        id: randomUUID(),
        organizationId: orgId,
        fssaiType: input.fssaiType,
        fssaiNumber: input.fssaiNumber,
        gstin: input.gstin,
    });
    // TODO: Redirect to pending page
    redirect("/pending");
}