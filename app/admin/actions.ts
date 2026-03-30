"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { organization, systemAdmin, organizationOwner, organizationDocument, organizationCompliance } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function approveOrganization(organizationId: string) {
  // 1. Get session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // 2. Check admin privilege
  const isAdmin = await db.select().from(systemAdmin).where(eq(systemAdmin.userId, session.user.id)).limit(1);

  if (isAdmin.length === 0) {
    throw new Error("Forbidden");
  }

  // 3. Validate org
  const org = await db.select({ status: organization.status }).from(organization).where(eq(organization.id, organizationId)).limit(1);

  if (org.length === 0) {
    throw new Error("Organization not found");
  }

  if (org[0].status !== "PENDING") {
    throw new Error("Only pending organizations can be approved");
  }

  // 4. Approve
  await db.update(organization).set({ status: "ACTIVE" }).where(eq(organization.id, organizationId));
}

export async function fetchPendingOrganizations() {
  // 1. Auth guard
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // 2. Admin guard
  const isAdmin = await db.select().from(systemAdmin).where(eq(systemAdmin.userId, session.user.id)).limit(1);

  if (isAdmin.length === 0) {
    throw new Error("Forbidden");
  }

  // 3. Fetch pending organizations
  const pendingOrgs = await db.select({
        organizationId: organization.id,
        name: organization.name,
        city: organization.city,
        createdAt: organization.createdAt,
        ownerName: organizationOwner.ownerName,
        phoneNumber: organizationOwner.phone,
    })
    .from(organization)
    .innerJoin(
      organizationOwner,
      eq(organizationOwner.organizationId, organization.id)
    )
    .where(eq(organization.status, "PENDING"))
    .orderBy(organization.createdAt);

  return pendingOrgs.map(org => ({
    ...org,
    createdAtFormatted: org.createdAt ? new Date(org.createdAt).toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }) : "N/A"
  }));
}

export async function fetchActiveOrganizations() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) throw new Error("Unauthorized");

  const isAdmin = await db.select().from(systemAdmin).where(eq(systemAdmin.userId, session.user.id)).limit(1);
  if (isAdmin.length === 0) throw new Error("Forbidden");

  const activeOrgs = await db.select({
        organizationId: organization.id,
        name: organization.name,
        city: organization.city,
        createdAt: organization.createdAt,
        ownerName: organizationOwner.ownerName,
        phoneNumber: organizationOwner.phone,
    })
    .from(organization)
    .innerJoin(
      organizationOwner,
      eq(organizationOwner.organizationId, organization.id)
    )
    .where(eq(organization.status, "ACTIVE"))
    .orderBy(organization.createdAt);

  return activeOrgs.map(org => ({
    ...org,
    createdAtFormatted: org.createdAt ? new Date(org.createdAt).toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }) : "N/A"
  }));
}

export async function fetchOrganizationDetails(organizationId: string) {
  // 1. Auth guard
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // 2. Admin guard
  const isAdmin = await db
    .select()
    .from(systemAdmin)
    .where(eq(systemAdmin.userId, session.user.id))
    .limit(1);

  if (isAdmin.length === 0) {
    throw new Error("Forbidden");
  }

  // 3. Fetch organization
  const org = await db
    .select()
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  if (org.length === 0) {
    throw new Error("Organization not found");
  }

  // 4. Fetch owner
  const owner = await db
    .select()
    .from(organizationOwner)
    .where(eq(organizationOwner.organizationId, organizationId))
    .limit(1);

  // 5. Fetch compliance
  const compliance = await db
    .select()
    .from(organizationCompliance)
    .where(eq(organizationCompliance.organizationId, organizationId))
    .limit(1);

  // 6. Fetch documents with storageKey
  const documents = await db.select({
        id: organizationDocument.id,
        documentType: organizationDocument.documentType,
        fileName: organizationDocument.fileName,
        fileMimeType: organizationDocument.fileMimeType,
        fileSize: organizationDocument.fileSize,
        storageKey: organizationDocument.storageKey,
        uploadedAt: organizationDocument.uploadedAt,
    })
  .from(organizationDocument)
  .where(eq(organizationDocument.organizationId, organizationId));

  // 7. Return structured result
  return {
    organization: {
      ...org[0],
      createdAtFormatted: org[0].createdAt ? new Date(org[0].createdAt).toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }) : "N/A"
    },
    owner: owner[0] ?? null,
    compliance: compliance[0] ?? null,
    documents: documents.map(doc => ({
      ...doc,
      uploadedAtFormatted: doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) : "N/A"
    })),
  };
}

export async function fetchAdminStats() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) throw new Error("Unauthorized");

  const isAdmin = await db.select().from(systemAdmin).where(eq(systemAdmin.userId, session.user.id)).limit(1);
  if (isAdmin.length === 0) throw new Error("Forbidden");

  const [totalCount] = await db.select({ count: sql<number>`count(*)` }).from(organization);
  const [activeCount] = await db.select({ count: sql<number>`count(*)` }).from(organization).where(eq(organization.status, "ACTIVE"));
  const [pendingCount] = await db.select({ count: sql<number>`count(*)` }).from(organization).where(eq(organization.status, "PENDING"));

  return { 
    total: Number(totalCount.count), 
    active: Number(activeCount.count), 
    pending: Number(pendingCount.count) 
  };
}
