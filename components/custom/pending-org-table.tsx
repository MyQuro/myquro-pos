import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type PendingOrg = {
  organizationId: string;
  name: string;
  city: string;
  ownerName: string;
  phoneNumber: string;
  createdAt: Date;
};

export default function PendingOrgTable({
  organizations,
}: {
  organizations: PendingOrg[];
}) {
  if (organizations.length === 0) {
    return <p>No organizations pending verification.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>City</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>

      <TableBody>
        {organizations.map((org) => (
          <TableRow key={org.organizationId}>
            <TableCell>{org.name}</TableCell>
            <TableCell>{org.city}</TableCell>
            <TableCell>{org.ownerName}</TableCell>
            <TableCell>{org.phoneNumber}</TableCell>
            <TableCell>
              {org.createdAt.toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Link
                href={`/admin/${org.organizationId}`}
                className="underline text-sm"
              >
                Review
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
