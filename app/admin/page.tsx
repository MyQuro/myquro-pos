import { requireAdmin } from "@/lib/require-admin";
import { fetchPendingOrganizations } from "./actions";
import PendingOrgTable from "@/components/custom/pending-org-table";
import { PendingOrg } from "@/components/custom/pending-org-table";
export default async function AdminPage() {
  await requireAdmin(); // SSR guard

  const allOrgs = await fetchPendingOrganizations();
  const pendingOrgs = allOrgs.filter((org) => org.createdAt !== null);

  return (
    <div className="max-w-5xl mx-auto mt-10 space-y-6">
      <h1 className="text-xl font-semibold">Pending Organizations</h1>
      <PendingOrgTable organizations={pendingOrgs as PendingOrg[]} />
    </div>
  );
}
