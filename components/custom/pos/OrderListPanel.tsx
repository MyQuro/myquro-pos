"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

type OrderListPanelProps = {
  activeOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
  onRefreshReady?: (refreshFn: () => void) => void;
};

type OrderSummary = {
  id: string;
  orderType: "DINE_IN" | "TAKEAWAY";
  status: "OPEN" | "BILLED" | "PAID";
  tableLabel?: string | null;
  orderNumber?: string | null;
  total?: number | null;
  createdAt: string;
};

export default function OrderListPanel({
  activeOrderId,
  onSelectOrder,
  onRefreshReady,
}: OrderListPanelProps) {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pos/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Expose refresh function to parent
  useEffect(() => {
    onRefreshReady?.(fetchOrders);
  }, [fetchOrders, onRefreshReady]);

  return (
    <div className="w-72 border-r h-full flex flex-col">
      <div className="p-3 border-b font-medium text-sm">Orders</div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <p className="p-3 text-sm text-muted-foreground">Loading orders…</p>
        )}

        {!loading && orders.length === 0 && (
          <p className="p-3 text-sm text-muted-foreground">No orders yet</p>
        )}

        {orders.map((order) => (
          <OrderRow
            key={order.id}
            order={order}
            active={order.id === activeOrderId}
            onClick={() => onSelectOrder(order.id)}
          />
        ))}
      </div>
    </div>
  );
}

function OrderRow({
  order,
  active,
  onClick,
}: {
  order: OrderSummary;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "px-3 py-2 cursor-pointer border-b text-sm hover:bg-muted/50 transition-colors",
        active && "bg-muted"
      )}
    >
      <div className="flex justify-between">
        <span className="font-medium">
          {order.orderType === "DINE_IN"
            ? order.tableLabel || "Dine-In"
            : order.orderNumber || "Takeaway"}
        </span>

        <StatusBadge status={order.status} />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {new Date(order.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>

        {order.total != null && (
          <span>₹{(order.total / 100).toFixed(2)}</span>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderSummary["status"] }) {
  const color =
    status === "OPEN"
      ? "text-blue-600"
      : status === "PAID"
      ? "text-green-600"
      : "text-orange-600";

  return <span className={cn("text-xs font-medium", color)}>{status}</span>;
}
