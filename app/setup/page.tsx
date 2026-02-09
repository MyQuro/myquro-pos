import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { organization, organizationOwner } from "@/db/schema";
import { eq } from "drizzle-orm";
import SetupForm from "@/components/custom/setup-form";

export default async function SetupPage() {
  // 1. Auth guard
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // 2. Fetch organization (if exists)
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

  // 3. No organization yet → allow setup
  if (result.length === 0) {
    return <SetupForm />;
  }

  const status = result[0].status;

  // 4. Redirect by status
  if (status === "PENDING") {
    redirect("/pending");
  }

  if (status === "ACTIVE") {
    redirect("/pos");
  }

  if (status === "REJECTED") {
    redirect("/login");
  }

  // Fallback (should never hit)
  return <SetupForm />;
}
