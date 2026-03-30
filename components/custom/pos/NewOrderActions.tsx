"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import NewOrderModal from "./NewOrderModal";
import { Restaurant, Delivery } from "@carbon/icons-react";

type NewOrderActionsProps = {
  onCreated: (orderId: string) => void;
};

export default function NewOrderActions({ onCreated }: NewOrderActionsProps) {
  const [open, setOpen] = useState(false);
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY" | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  function openModal(type: "DINE_IN" | "TAKEAWAY") {
    startTransition(() => {
      setOrderType(type);
      setOpen(true);
    });
  }

  function handleCreated(orderId: string) {
    // Optimistic UI: Close modal immediately
    setOpen(false);
    setOrderType(null);

    // Background processing: Notify parent
    startTransition(() => {
      onCreated(orderId);
    });
  }

  function handleClose() {
    setOpen(false);
    setOrderType(null);
  }

  return (
    <>
      <div className="flex gap-2.5">
        <Button
          variant="outline"
          onClick={() => openModal("DINE_IN")}
          disabled={isPending}
          className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800 hover:text-white text-neutral-400 h-10 rounded-xl transition-all font-bold text-[11px] uppercase tracking-wider"
        >
          <Restaurant size={18} className="mr-2" />
          Dine-In
        </Button>

        <Button 
          onClick={() => openModal("TAKEAWAY")} 
          disabled={isPending}
          className="bg-neutral-50 hover:bg-white text-black h-10 rounded-xl transition-all font-bold text-[11px] uppercase tracking-wider shadow-[0_0_20px_rgba(255,255,255,0.05)]"
        >
          <Delivery size={18} className="mr-2" />
          Takeaway
        </Button>
      </div>

      {orderType && (
        <NewOrderModal
          open={open}
          orderType={orderType}
          onClose={handleClose}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
