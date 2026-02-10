import { redirect } from "next/navigation";
import { db } from "@/db";
import { organization, organizationOwner } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Ensures the user belongs to an ACTIVE organization.
 * Redirects otherwise.
 *
 * @returns { organizationId: string }
 */
export async function requireActiveOrganization(userId: string) {
  const result = await db
    .select({
      organizationId: organization.id,
      status: organization.status,
    })
    .from(organizationOwner)
    .innerJoin(
      organization,
      eq(organizationOwner.organizationId, organization.id)
    )
    .where(eq(organizationOwner.userId, userId))
    .limit(1);

  // No organization → setup
  if (result.length === 0) {
    redirect("/setup");
  }

  const { organizationId, status } = result[0];

  // Route by status
  if (status === "PENDING") {
    redirect("/pending");
  }

  if (status === "REJECTED") {
    redirect("/login");
  }

  if (status !== "ACTIVE") {
    redirect("/login"); // safety fallback
  }

  // ACTIVE → allow
  return {
    organizationId,
  };
}
