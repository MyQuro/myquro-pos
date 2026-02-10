"use client";

import { approveOrganization } from "../actions";
import { Button } from "@/components/ui/button";

export default function ReviewActions({
  organizationId,
}: {
  organizationId: string;
}) {
  return (
    <div className="flex gap-4">
      <Button
        onClick={async () => {
          await approveOrganization(organizationId);
          window.location.href = "/admin";
        }}
      >
        Approve
      </Button>
    </div>
  );
}
