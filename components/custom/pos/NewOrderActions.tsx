"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import NewOrderModal from "./NewOrderModal";

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
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => openModal("DINE_IN")}
          disabled={isPending}
        >
          New Dine-In
        </Button>

        <Button onClick={() => openModal("TAKEAWAY")} disabled={isPending}>
          New Takeaway
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
