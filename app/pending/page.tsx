import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { organization, organizationOwner } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function PendingPage() {
  // 1. Auth guard
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // 2. Fetch organization for this user
  const result = await db
    .select({
      status: organization.status,
    })
    .from(organizationOwner)
    .innerJoin(
      organization,
      eq(organizationOwner.organizationId, organization.id)
    )
    .where(eq(organizationOwner.userId, session.user.id))
    .limit(1);

  // 3. If no organization → setup
  if (result.length === 0) {
    redirect("/setup");
  }

  const status = result[0].status;

  // 4. Route by status
  if (status === "ACTIVE") {
    redirect("/pos");
  }

  if (status === "REJECTED") {
    redirect("/login");
  }

  // 5. PENDING → render page
  return (
    <div className="h-screen flex items-center justify-center">
      <p>Your account is under verification.</p>
    </div>
  );
}
