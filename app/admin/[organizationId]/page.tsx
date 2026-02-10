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

  const { organizationId } = await params; // <-- Add await here
  const data = await fetchOrganizationDetails(organizationId);

  return (
    <div className="max-w-3xl mx-auto mt-10 space-y-6">
      <OrgDetail data={data} />
      <ReviewActions organizationId={organizationId} />
    </div>
  );
}
