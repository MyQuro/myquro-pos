import { requireAdmin } from "@/lib/require-admin";
import { fetchOrganizationDetails } from "../actions";
import OrgDetail from "@/components/custom/org-detail";
import ReviewActions from "./review-actions";

export default async function AdminDetailPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  await requireAdmin(); // SSR guard

  const { organizationId } = await params;
  const data = await fetchOrganizationDetails(organizationId);

  return (
    <div className="bg-[#0a0a0a] min-h-screen pb-32">
       <div className="max-w-5xl mx-auto pt-10">
          <OrgDetail data={data} />
          <ReviewActions 
            organizationId={organizationId} 
            status={data.organization.status} 
          />
       </div>
    </div>
  );
}
