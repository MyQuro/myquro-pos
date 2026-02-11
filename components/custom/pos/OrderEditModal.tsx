"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OrderEditModalProps = {
  open: boolean;
  orderId: string | null;
  onClose: () => void;
  onOrderUpdated?: () => void;
};

type OrderItem = {
  id: string;
  itemName: string;
  itemCode: string;
  quantity: number;
  lineTotal: number;
};

type OrderDetail = {
  status: "OPEN" | "BILLED" | "PAID";
};

export default function OrderEditModal({
  open,
  orderId,
  onClose,
  onOrderUpdated,
}: OrderEditModalProps) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [status, setStatus] = useState<OrderDetail["status"] | null>(null);
  const [searchCode, setSearchCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [removingItem, setRemovingItem] = useState<string | null>(null);
  const [addingItem, setAddingItem] = useState(false);

  const fetchOrder = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pos/orders/${id}`);
      const data = await res.json();
      setItems(data.items);
      setStatus(data.order.status);
    } catch (error) {
      console.error("Failed to fetch order:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !orderId) return;
    fetchOrder(orderId);
  }, [open, orderId, fetchOrder]);

  const addItemByCode = useCallback(
    async (code: string) => {
      if (!orderId || !code) return;

      setAddingItem(true);
      try {
        const res = await fetch(
          `/api/pos/menu/items/search?code=${encodeURIComponent(code)}`
        );
        const foundItems = await res.json();

        if (foundItems.length === 0) {
          alert(`No item found with code "${code}"`);
          return;
        }

        await fetch(`/api/pos/orders/${orderId}/items`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            menuItemId: foundItems[0].id,
            quantity: 1,
          }),
        });

        setSearchCode("");
        await fetchOrder(orderId);

        // Notify parent that order was updated
        onOrderUpdated?.();
      } catch (error) {
        console.error("Failed to add item:", error);
        alert("Failed to add item to order");
      } finally {
        setAddingItem(false);
      }
    },
    [orderId, fetchOrder, onOrderUpdated]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!orderId) return;

      setRemovingItem(itemId);
      try {
        await fetch(`/api/pos/orders/${orderId}/items/${itemId}`, {
          method: "DELETE",
        });

        await fetchOrder(orderId);

        // Notify parent that order was updated
        onOrderUpdated?.();
      } catch (error) {
        console.error("Failed to remove item:", error);
        alert("Failed to remove item");
      } finally {
        setRemovingItem(null);
      }
    },
    [orderId, fetchOrder, onOrderUpdated]
  );

  const editable = status === "OPEN";
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Edit Order</DialogTitle>
            {status && (
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full ${
                  status === "OPEN"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : status === "BILLED"
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                    : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                }`}
              >
                {status}
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!editable ? (
            <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground">
                ⓘ This order can no longer be edited because it has been{" "}
                {status === "BILLED" ? "billed" : "paid"}.
              </p>
            </div>
          ) : (
            <div className="mb-6">
              <Label htmlFor="item-search" className="text-sm font-medium mb-2">
                Add Item by Code
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="item-search"
                  placeholder="Enter item code (e.g., F001)"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchCode.trim()) {
                      addItemByCode(searchCode);
                    }
                  }}
                  disabled={addingItem}
                  className="flex-1"
                />
                <Button
                  onClick={() => addItemByCode(searchCode)}
                  disabled={!searchCode.trim() || addingItem}
                  className="shrink-0"
                >
                  {addingItem ? (
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
                      Adding...
                    </>
                  ) : (
                    "Add Item"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Items List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                Order Items ({items.length})
              </h3>
              {!loading && items.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  Total: ₹{(total / 100).toFixed(2)}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
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
                  <p className="text-sm text-muted-foreground">Loading order...</p>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg py-12 text-center">
                <p className="text-muted-foreground text-sm">
                  No items in this order
                </p>
                {editable && (
                  <p className="text-muted-foreground text-xs mt-1">
                    Add items using the search above
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="group relative bg-card border rounded-lg p-4 transition-all hover:shadow-md hover:border-primary/50"
                    style={{
                      animation: "fadeIn 0.3s ease-in-out",
                      animationDelay: `${index * 0.05}s`,
                      animationFillMode: "backwards",
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <h4 className="font-medium text-base truncate">
                            {item.itemName}
                          </h4>
                          <span className="text-xs text-muted-foreground font-mono shrink-0">
                            {item.itemCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>Qty: {item.quantity}</span>
                          <span className="text-xs">•</span>
                          <span>
                            ₹{(item.lineTotal / item.quantity / 100).toFixed(2)} each
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-semibold text-lg">
                          ₹{(item.lineTotal / 100).toFixed(2)}
                        </span>

                        {editable && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(item.id)}
                            disabled={removingItem === item.id}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            {removingItem === item.id ? (
                              <svg
                                className="animate-spin h-4 w-4"
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
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                <line x1="10" x2="10" y1="11" y2="17" />
                                <line x1="14" x2="14" y1="11" y2="17" />
                              </svg>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t px-6 py-4 bg-muted/30 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">
                Total Items: {items.length}
              </span>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Grand Total</div>
                <div className="text-2xl font-bold text-primary">
                  ₹{(total / 100).toFixed(2)}
                </div>
              </div>
            </div>
            <Button onClick={onClose} className="w-full" size="lg">
              Close
            </Button>
          </div>
        )}

        {items.length === 0 && (
          <div className="border-t px-6 py-4 shrink-0">
            <Button onClick={onClose} variant="outline" className="w-full">
              Close
            </Button>
          </div>
        )}

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
