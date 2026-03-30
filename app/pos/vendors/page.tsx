import { requireActiveOrganization } from "@/lib/require-active-organization";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import VendorManagement from "@/components/custom/pos/VendorManagement";

export default async function VendorsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  await requireActiveOrganization(session.user.id);

  return (
    <div className="space-y-6">
      <VendorManagement />
    </div>
  );
}
