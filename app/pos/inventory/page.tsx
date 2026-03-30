import { requireActiveOrganization } from "@/lib/require-active-organization";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import InventoryManagement from "@/components/custom/pos/InventoryManagement";

export default async function InventoryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  await requireActiveOrganization(session.user.id);

  return (
    <div className="space-y-6">
      <InventoryManagement />
    </div>
  );
}
