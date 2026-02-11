"use client";

import NewOrderActions from "./NewOrderActions";

type OrdersTopBarProps = {
  onNewOrder: (orderId: string) => void;
};

export default function OrdersTopBar({ onNewOrder }: OrdersTopBarProps) {
  return (
    <div className="h-14 px-4 border-b flex items-center justify-between">
      <span className="text-lg font-semibold">Orders</span>

      <div className="flex items-center gap-4">
        <NewOrderActions onCreated={onNewOrder} />
        <Clock />
      </div>
    </div>
  );
}

/**
 * Dumb clock for now.
 * We'll upgrade it later without touching OrdersTopBar.
 */
function Clock() {
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <span className="text-sm text-muted-foreground">
      {time}
    </span>
  );
}
