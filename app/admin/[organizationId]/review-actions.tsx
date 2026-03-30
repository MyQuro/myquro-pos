"use client";

import { useState } from "react";
import { approveOrganization } from "../actions";
import { Button } from "@/components/ui/button";
import { CheckmarkOutline, Close, Pending } from "@carbon/icons-react";
import { motion } from "framer-motion";

export default function ReviewActions({
  organizationId,
  status
}: {
  organizationId: string;
  status: string;
}) {
  const [isApproving, setIsApproving] = useState(false);

  if (status !== "PENDING") {
    return null;
  }

  async function handleApprove() {
    setIsApproving(true);
    try {
      await approveOrganization(organizationId);
      window.location.href = "/admin";
    } catch (err) {
      console.error("Approve failed:", err);
      alert("Failed to approve organization");
    } finally {
      setIsApproving(false);
    }
  }

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="max-w-4xl mx-auto px-6 flex gap-4 mt-8"
    >
      <Button
        size="lg"
        onClick={handleApprove}
        disabled={isApproving}
        className="flex-1 h-14 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-bold text-[12px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(34,197,94,0.2)] active:scale-95 transition-all"
      >
        {isApproving ? (
          <div className="size-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="flex items-center gap-2.5">
            <CheckmarkOutline size={20} /> Approve Registration
          </span>
        )}
      </Button>

      <Button
        size="lg"
        variant="outline"
        className="px-8 h-14 rounded-2xl bg-neutral-900 border-neutral-800 hover:bg-neutral-800 hover:text-white text-neutral-500 font-bold text-[11px] uppercase tracking-widest transition-all"
      >
        <Close size={20} className="mr-2" /> Reject
      </Button>
    </motion.div>
  );
}
