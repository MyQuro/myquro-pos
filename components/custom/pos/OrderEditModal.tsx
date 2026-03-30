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
import { motion, AnimatePresence } from "framer-motion";
import { Close, Add, TrashCan, Receipt, Search } from "@carbon/icons-react";
import { cn } from "@/lib/utils";

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
      <DialogContent className="!max-w-2xl !h-[80vh] !p-0 !gap-0 flex flex-col bg-[#0a0a0a] border-neutral-800 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <DialogHeader className="px-8 py-6 border-b border-neutral-800 bg-[#0a0a0a] shrink-0 flex flex-row items-center justify-between z-20 space-y-0">
          <div className="flex items-center gap-4">
             <div className="size-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
               <Receipt size={20} />
             </div>
             <div>
               <DialogTitle className="text-xl font-bold text-neutral-50 tracking-tight">Edit Order</DialogTitle>
               <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1">Order Summary • Session {orderId?.slice(0, 8).toUpperCase()}</p>
             </div>
          </div>
          {status && (
            <span
              className={cn(
                "text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-widest flex items-center gap-2",
                status === "OPEN" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                status === "BILLED" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                "bg-green-500/10 text-green-400 border-green-500/20"
              )}
            >
              <span className={cn(
                "size-1.5 rounded-full",
                status === "OPEN" ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" :
                status === "BILLED" ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" :
                "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
              )} />
              {status}
            </span>
          )}
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-[#0a0a0a] scrollbar-hide">
          {!editable ? (
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <div className="size-5 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0 mt-0.5">
                <Receipt size={12} />
              </div>
              <p className="text-[12px] font-medium text-neutral-400 leading-relaxed">
                This order is locked because it has been{" "}
                <span className="text-orange-400 font-bold uppercase">{status === "BILLED" ? "billed" : "paid"}</span>. 
                Edit operations are suspended for finalized records.
              </p>
            </div>
          ) : (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                 <Label htmlFor="item-search" className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                   Quick Add Item
                 </Label>
                 <span className="text-[10px] font-bold text-neutral-500">Scan SKU or Enter Code</span>
              </div>
              <div className="flex gap-2 group">
                <div className="relative flex-1">
                   <Input
                     id="item-search"
                     placeholder="Search by code (e.g., F001)"
                     value={searchCode}
                     onChange={(e) => setSearchCode(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === "Enter" && searchCode.trim()) {
                         addItemByCode(searchCode);
                       }
                     }}
                     disabled={addingItem}
                     className="h-12 bg-neutral-900 border-neutral-800 focus:border-neutral-700 text-neutral-100 rounded-xl pl-10"
                   />
                   <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-700 group-focus-within:text-neutral-400" />
                </div>
                <Button
                  onClick={() => addItemByCode(searchCode)}
                  disabled={!searchCode.trim() || addingItem}
                  className="h-12 px-6 bg-neutral-50 hover:bg-white text-black font-bold text-[11px] uppercase tracking-wider rounded-xl transition-all active:scale-95"
                >
                  {addingItem ? (
                    <div className="size-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Add Item"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                 Order Items ({items.length})
               </h3>
               {!loading && items.length > 0 && (
                 <span className="text-[11px] font-bold text-neutral-400 tabular-nums">
                   SUBTOTAL: ₹{(total / 100).toFixed(2)}
                 </span>
               )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                <div className="size-10 border-4 border-neutral-900 border-t-neutral-500 rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">Retrieving Order Data</p>
              </div>
            ) : items.length === 0 ? (
              <div className="border-2 border-dashed border-neutral-800 rounded-3xl py-16 text-center bg-neutral-900/10">
                <Receipt size={32} className="mx-auto mb-4 text-neutral-700 opacity-50" />
                <p className="text-[11px] font-bold text-neutral-600 uppercase tracking-widest">Zero Items Found</p>
                {editable && (
                  <p className="text-[11px] text-neutral-700 mt-2">Use the search above to add products</p>
                )}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    key={item.id}
                    className="group bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 hover:bg-neutral-900 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1.5">
                          <h4 className="font-bold text-[15px] text-neutral-200 group-hover:text-white transition-colors truncate">
                            {item.itemName}
                          </h4>
                          <span className="text-[10px] font-mono text-neutral-600 group-hover:text-neutral-500 transition-colors uppercase tracking-widest bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                             ID: {item.itemCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                          <span>Qty: {item.quantity.toString().padStart(2, '0')}</span>
                          <span className="size-1 rounded-full bg-neutral-800" />
                          <span className="tabular-nums">
                            ₹{(item.lineTotal / item.quantity / 100).toFixed(2)} / unit
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <span className="font-bold text-lg text-neutral-50 tabular-nums tracking-tighter">
                          ₹{(item.lineTotal / 100).toFixed(2)}
                        </span>

                        {editable && (
                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={removingItem === item.id}
                            className="size-8 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-600 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 flex items-center justify-center transition-all group/btn"
                          >
                            {removingItem === item.id ? (
                              <div className="size-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <TrashCan size={16} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-neutral-800 bg-[#0a0a0a] shadow-[0_-20px_40px_rgba(0,0,0,0.5)] z-20">
          <div className="flex items-end justify-between mb-8">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Summary Overview</p>
              <p className="text-[13px] text-neutral-400 font-medium">Items included: {items.length}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[11px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Total Amount</p>
              <h3 className="text-4xl font-bold tracking-tighter text-neutral-50 tabular-nums">
                ₹{(total / 100).toFixed(0)}
              </h3>
            </div>
          </div>
          <Button 
             onClick={onClose} 
             className="w-full h-12 rounded-2xl bg-neutral-50 hover:bg-white text-black font-bold text-[12px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98]"
          >
            Close Summary
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
