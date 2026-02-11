"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import MakePaymentModal from "./MakePaymentModal";
import { printOrder } from "@/lib/pos/printClient";

type OrderDetailPanelProps = {
  activeOrderId: string | null;
  onEditOrder: () => void;
  onRefreshReady?: (refreshFn: () => void) => void;
  onBilled?: () => void;
};

type OrderItem = {
  id: string;
  itemName: string;
  itemCode: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

type OrderDetail = {
  id: string;
  orderType: "DINE_IN" | "TAKEAWAY";
  status: "OPEN" | "BILLED" | "PAID";
  tableLabel?: string | null;
  customerName?: string | null;
  subtotal?: number | null;
  tax?: number | null;
  total?: number | null;
};

export default function OrderDetailPanel({
  activeOrderId,
  onEditOrder,
  onRefreshReady,
  onBilled,
}: OrderDetailPanelProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBilling, setIsBilling] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const fetchOrder = useCallback(async (orderId: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/pos/orders/${orderId}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load order");
        setOrder(null);
        setItems([]);
        return;
      }

      setOrder(data.order);
      setItems(data.items);
    } catch (err) {
      console.error("Failed to fetch order:", err);
      setError("Failed to load order");
      setOrder(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeOrderId) {
      setOrder(null);
      setItems([]);
      setError(null);
      return;
    }

    fetchOrder(activeOrderId);
  }, [activeOrderId, fetchOrder]);

  // Expose refresh function to parent
  useEffect(() => {
    if (activeOrderId) {
      onRefreshReady?.(() => fetchOrder(activeOrderId));
    }
  }, [activeOrderId, fetchOrder, onRefreshReady]);

  async function generateBill() {
    if (!activeOrderId) return;
    if (items.length === 0) {
      alert("Cannot generate bill for empty order");
      return;
    }

    setIsBilling(true);

    try {
      // POST to /bill endpoint (no body needed per current implementation)
      const res = await fetch(`/api/pos/orders/${activeOrderId}/bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to generate bill" }));
        alert(err.error || "Failed to generate bill");
        return;
      }

      const billResult = await res.json();
      console.log("Bill generated:", billResult);

      // Refresh local view to show updated status/totals
      await fetchOrder(activeOrderId);

      // Notify parent (order list) to refresh
      onBilled?.();
    } catch (err) {
      console.error("Failed to generate bill:", err);
      alert("Failed to generate bill. Please try again.");
    } finally {
      setIsBilling(false);
    }
  }

  async function handlePrint(type: "BILL" | "KOT") {
    if (!activeOrderId) return;

    setIsPrinting(true);
    try {
      await printOrder(activeOrderId, type);
      // Optional: Show success message
      console.log(`${type} printed successfully`);
    } catch (err) {
      console.error(`Failed to print ${type}:`, err);
      alert(`Failed to print ${type}. Please check the print bridge.`);
    } finally {
      setIsPrinting(false);
    }
  }

  function handlePaymentSuccess() {
    if (activeOrderId) {
      fetchOrder(activeOrderId);
      onBilled?.(); // Refresh parent order list
    }
  }

  if (!activeOrderId) {
    return <EmptyState message="Select an order to view details" />;
  }

  if (loading) {
    return (
      <div className="w-96 border-l h-full flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 mx-auto mb-2 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-sm text-muted-foreground">Loading order…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-96 border-l h-full p-4">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md p-3">
          {error}
        </div>
      </div>
    );
  }

  if (!order) {
    return <EmptyState message="Order not found" />;
  }

  return (
    <div className="w-96 border-l h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">
              {order.orderType === "DINE_IN"
                ? order.tableLabel || "Dine-In"
                : "Takeaway"}
            </h3>
            {order.customerName && (
              <p className="text-sm text-muted-foreground mt-1">
                {order.customerName}
              </p>
            )}
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Print Buttons - Available for all orders with items */}
        {items.length > 0 && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePrint("KOT")}
              disabled={isPrinting}
              className="flex-1"
            >
              {isPrinting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Printing…
                </>
              ) : (
                "🧑‍🍳 KOT"
              )}
            </Button>

            {(order.status === "BILLED" || order.status === "PAID") && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePrint("BILL")}
                disabled={isPrinting}
                className="flex-1"
              >
                {isPrinting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Printing…
                  </>
                ) : (
                  "🧾 Bill"
                )}
              </Button>
            )}
          </div>
        )}

        {order.status === "OPEN" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onEditOrder}
              className="flex-1"
            >
              Edit Order
            </Button>

            <Button
              size="sm"
              onClick={generateBill}
              disabled={isBilling || items.length === 0}
              className="flex-1"
            >
              {isBilling ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating…
                </>
              ) : (
                "Generate Bill"
              )}
            </Button>
          </div>
        )}

        {order.status === "BILLED" && (
          <Button
            size="sm"
            onClick={() => setIsPaymentModalOpen(true)}
            className="w-full"
          >
            Make Payment
          </Button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4">
        <h4 className="text-sm font-medium mb-3">Items ({items.length})</h4>

        {items.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg py-12 text-center">
            <p className="text-sm text-muted-foreground">No items in this order</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-3 text-sm bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium">{item.itemName}</span>
                  <span className="text-muted-foreground font-mono text-xs">
                    ×{item.quantity}
                  </span>
                </div>
                <div className="flex justify-between mt-1.5 text-xs">
                  <span className="text-muted-foreground">{item.itemCode}</span>
                  <span className="font-semibold text-sm">
                    ₹{(item.lineTotal / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Totals */}
      {order.total != null && (
        <div className="border-t p-4 space-y-2 bg-muted/20">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>₹{((order.subtotal ?? 0) / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>₹{((order.tax ?? 0) / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total</span>
            <span>₹{(order.total / 100).toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {order && order.status === "BILLED" && order.total != null && (
        <MakePaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          orderId={order.id}
          total={order.total}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="w-96 border-l h-full flex items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function StatusBadge({ status }: { status: OrderDetail["status"] }) {
  const styles = {
    OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    BILLED: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    PAID: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  };

  return (
    <span className={cn("text-xs font-medium px-2 py-1 rounded", styles[status])}>
      {status}
    </span>
  );
}
