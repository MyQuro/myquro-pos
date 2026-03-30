"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ArrowRight } from "@carbon/icons-react";

export type PendingOrg = {
  organizationId: string;
  name: string;
  city: string;
  ownerName: string;
  phoneNumber: string;
  createdAt: Date | null;
  createdAtFormatted?: string;
};

export default function PendingOrgTable({
  organizations,
}: {
  organizations: PendingOrg[];
}) {
  if (organizations.length === 0) {
    return (
      <div className="py-20 text-center opacity-30 px-6">
         <p className="text-sm font-medium">All Clear</p>
         <p className="text-[11px] mt-1">No organizations pending verification</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <Table>
        <TableHeader className="bg-neutral-900/50">
          <TableRow className="border-neutral-800 hover:bg-transparent">
            <TableHead className="font-bold text-[10px] uppercase tracking-[0.2em] text-neutral-500 py-5">Organization</TableHead>
            <TableHead className="font-bold text-[10px] uppercase tracking-[0.2em] text-neutral-500 py-5">Location</TableHead>
            <TableHead className="font-bold text-[10px] uppercase tracking-[0.2em] text-neutral-500 py-5">Owner</TableHead>
            <TableHead className="font-bold text-[10px] uppercase tracking-[0.2em] text-neutral-500 py-5">Phone</TableHead>
            <TableHead className="font-bold text-[10px] uppercase tracking-[0.2em] text-neutral-500 py-5">Submitted</TableHead>
            <TableHead className="py-5" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {organizations.map((org) => (
            <TableRow key={org.organizationId} className="border-neutral-800/50 hover:bg-neutral-900/40 transition-colors group">
              <TableCell className="py-5">
                 <div className="font-bold text-neutral-200 group-hover:text-white transition-colors">{org.name}</div>
                 <div className="text-[10px] font-mono text-neutral-600 mt-0.5 uppercase tracking-tighter">ID: {org.organizationId.slice(0, 8)}</div>
              </TableCell>
              <TableCell className="py-5">
                 <span className="text-[13px] text-neutral-400 font-medium">{org.city}</span>
              </TableCell>
              <TableCell className="py-5">
                 <span className="text-[13px] text-neutral-400 font-medium">{org.ownerName}</span>
              </TableCell>
              <TableCell className="py-5 font-mono text-[11px] text-neutral-500">
                {org.phoneNumber}
              </TableCell>
              <TableCell className="py-5">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                  {org.createdAtFormatted || "N/A"}
                </span>
              </TableCell>
              <TableCell className="py-5 text-right pr-6">
                <Link
                  href={`/admin/${org.organizationId}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] font-bold text-neutral-400 uppercase tracking-[0.15em] hover:bg-neutral-50 hover:text-black hover:border-transparent transition-all active:scale-95 group-hover:border-neutral-700"
                >
                  Review <ArrowRight size={14} />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
