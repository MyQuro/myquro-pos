import { requireActiveOrganization } from "@/lib/require-active-organization";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import MenuManagement from "@/components/custom/menu-management/MenuManagement";

export default async function MenuPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Guard org (already redirects if invalid)
  await requireActiveOrganization(session.user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Menu Management</h1>
      <MenuManagement />
    </div>
  );
}
