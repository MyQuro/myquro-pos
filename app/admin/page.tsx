import { requireAdmin } from "@/lib/require-admin";
import { fetchPendingOrganizations, fetchActiveOrganizations, fetchAdminStats } from "./actions";
import { AdminDashboardClient } from "./admin-client";
import { PendingOrg } from "@/components/custom/pending-org-table";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function AdminPage() {
  await requireAdmin(); // SSR guard

  const [pendingOrgs, activeOrgs, stats] = await Promise.all([
    fetchPendingOrganizations(),
    fetchActiveOrganizations(),
    fetchAdminStats()
  ]);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <AdminDashboardClient 
      stats={stats} 
      pendingOrgs={pendingOrgs as PendingOrg[]} 
      activeOrgs={activeOrgs as PendingOrg[]}
      adminName={session?.user.name || "Super Admin"}
    />
  );
}
