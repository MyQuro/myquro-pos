"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Receipt, Printer, Edit, Purchase, Wallet } from "@carbon/icons-react";
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
      <div className="w-full lg:w-[320px] lg:min-w-[320px] lg:max-w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l border-neutral-800 bg-[#0a0a0a] h-64 lg:h-full flex flex-col items-center justify-center p-12 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative flex flex-col items-center"
        >
          <div className="size-16 relative mb-6">
            <div className="absolute inset-0 border-4 border-neutral-900 rounded-2xl" />
            <motion.div 
               animate={{ 
                 rotate: 360,
                 borderRadius: ["20%", "40%", "20%"]
               }}
               transition={{ 
                 rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                 borderRadius: { duration: 2, repeat: Infinity, ease: "easeInOut" }
               }}
               className="absolute inset-0 border-t-4 border-neutral-400 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            />
          </div>
          <div className="space-y-2 text-center">
            <h3 className="font-bold text-neutral-500 uppercase tracking-[0.2em] text-[10px] animate-pulse">Loading Order</h3>
            <p className="text-[11px] text-neutral-700 font-medium">Fetching order details...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full lg:w-[320px] lg:min-w-[320px] lg:max-w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l border-neutral-800 bg-[#0a0a0a] h-64 lg:h-full p-6 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/5 border border-red-500/20 text-red-400 text-[11px] font-bold uppercase tracking-widest rounded-2xl p-6 text-center shadow-[0_0_30px_rgba(239,68,68,0.05)]"
        >
          <p className="mb-2">Order Error</p>
          <p className="text-neutral-500 font-medium normal-case tracking-normal text-[12px]">{error}</p>
        </motion.div>
      </div>
    );
  }

  if (!order) {
    return <EmptyState message="No receipt data found" />;
  }

  return (
    <div className="w-full lg:w-[320px] lg:min-w-[320px] lg:max-w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l border-neutral-800 bg-[#0a0a0a] h-auto min-h-[50vh] lg:h-full flex flex-col relative overflow-hidden">
      {/* Header */}
      <motion.div 
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="p-5 border-b border-neutral-800/50 space-y-4 bg-[#0a0a0a]/80 backdrop-blur-xl z-20"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Order Summary</p>
            <h3 className="font-bold text-xl tracking-tight text-neutral-50">
              {order.orderType === "DINE_IN"
                ? order.tableLabel || "Dine-In"
                : "Takeaway Order"}
            </h3>
            {order.customerName && (
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="size-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <p className="font-medium text-[12px] text-neutral-400 group-hover:text-neutral-200 transition-colors">
                  {order.customerName}
                </p>
              </div>
            )}
          </div>
          <StatusBadge status={order.status} active={true} />
        </div>

        {/* Global Actions */}
        <div className="grid grid-cols-2 gap-2.5">
          {items.length > 0 && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePrint("KOT")}
                disabled={isPrinting}
                className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800 hover:text-white text-neutral-400 h-10 rounded-xl transition-all"
              >
                {isPrinting ? (
                  <div className="size-4 border-2 border-neutral-600 border-t-neutral-100 rounded-full animate-spin" />
                ) : (
                  <span className="flex items-center gap-2 font-bold text-[11px] uppercase tracking-wider"><Printer size={16}/> Print KOT</span>
                )}
              </Button>

              {(order.status === "BILLED" || order.status === "PAID") && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePrint("BILL")}
                  disabled={isPrinting}
                  className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800 hover:text-white text-neutral-400 h-10 rounded-xl transition-all"
                >
                  {isPrinting ? (
                    <div className="size-4 border-2 border-neutral-600 border-t-neutral-100 rounded-full animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2 font-bold text-[11px] uppercase tracking-wider"><Receipt size={16}/> Print Bill</span>
                  )}
                </Button>
              )}
            </>
          )}
        </div>

        {order.status === "OPEN" && (
          <div className="flex gap-2.5">
            <Button
              size="sm"
              variant="outline"
              onClick={onEditOrder}
              className="flex-1 bg-neutral-900 border-neutral-800 hover:bg-neutral-800 hover:text-white text-neutral-400 h-11 rounded-xl font-bold text-[11px] uppercase tracking-wider"
            >
              <Edit size={16} className="mr-2"/> Edit Order
            </Button>

            <Button
              size="sm"
              onClick={generateBill}
              disabled={isBilling || items.length === 0}
              className="flex-1 bg-neutral-50 hover:bg-white text-black h-11 rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 transition-all"
            >
              {isBilling ? (
                <div className="size-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="flex items-center gap-2"><Receipt size={16}/> Finalize Bill</span>
              )}
            </Button>
          </div>
        )}

        {order.status === "BILLED" && (
          <Button
            size="lg"
            onClick={() => setIsPaymentModalOpen(true)}
            className="w-full h-12 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-[12px] uppercase tracking-[0.15em] shadow-[0_0_30px_rgba(34,197,94,0.2)] transform transition-all active:scale-[0.98] ring-offset-[#0a0a0a] ring-offset-2 focus:ring-2 focus:ring-green-500"
          >
            <Wallet size={20} className="mr-2.5"/> Collect Payment
          </Button>
        )}
      </motion.div>      {/* Items Stream */}
      <div className="flex-1 overflow-y-auto p-5 relative scrollbar-hide">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold text-[10px] tracking-[0.2em] text-neutral-500 uppercase">Order Items ({items.length})</h4>
          <div className="h-[1px] flex-1 bg-neutral-800 ml-4" />
        </div>

        {items.length === 0 ? (
          <div className="border-2 border-dashed border-neutral-800 rounded-3xl py-16 text-center bg-neutral-900/20">
            <Receipt size={32} className="mx-auto mb-4 text-neutral-700 opacity-50" />
            <p className="font-bold text-[11px] text-neutral-600 uppercase tracking-widest">No Items Yet</p>
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 }}}}
            className="space-y-3"
          >
            {items.map((item) => (
              <motion.div
                variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 25 }}}}
                key={item.id}
                className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-3 group hover:bg-neutral-900 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className="font-bold text-[13px] text-neutral-200 group-hover:text-white transition-colors leading-tight">{item.itemName}</span>
                  <div className="bg-neutral-800 text-neutral-400 font-mono text-[9px] px-1.5 py-0.5 rounded-full border border-neutral-700/50">
                    {item.quantity.toString().padStart(2, '0')}
                  </div>
                </div>
                <div className="flex justify-between items-center text-[9px]">
                  <span className="font-mono text-neutral-600 uppercase tracking-tighter">{item.itemCode}</span>
                  <span className="font-bold text-[14px] tracking-tighter text-neutral-100">
                    ₹{(item.lineTotal / 100).toFixed(2)}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Terminal Footer */}
      {order.total != null && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }}
          className="border-t border-neutral-800 p-6 space-y-3 bg-[#0a0a0a] shadow-[0_-20px_40px_rgba(0,0,0,0.5)] z-20"
        >
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              <span>Subtotal</span>
              <span className="text-neutral-300 tabular-nums">₹{((order.subtotal ?? 0) / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              <span>Taxes</span>
              <span className="text-neutral-300 tabular-nums">₹{((order.tax ?? 0) / 100).toFixed(2)}</span>
            </div>
          </div>
          
          <div className="border-t border-dashed border-neutral-800 pt-5 mt-2 flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.3em]">Total Amount</p>
              <span className="font-bold text-3xl tracking-tighter text-neutral-50 tabular-nums">
                ₹{(order.total / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Payment Modal — always rendered to prevent lifecycle races */}
      <MakePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        orderId={order?.id || ""}
        total={order?.total || 0}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="w-full lg:w-[320px] lg:min-w-[320px] lg:max-w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l border-neutral-800 bg-[#0a0a0a] h-64 lg:h-full flex flex-col items-center justify-center p-12 text-center">
      <div className="size-20 bg-neutral-900 rounded-3xl flex items-center justify-center mb-6 border border-neutral-800 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <Receipt size={32} className="text-neutral-600" />
      </div>
      <h3 className="font-bold text-neutral-500 uppercase tracking-[0.2em] text-xs mb-2">No Order Selected</h3>
      <p className="text-[13px] text-neutral-700 max-w-[200px] leading-relaxed">{message}</p>
    </div>
  );
}

function StatusBadge({ status, active }: { status: OrderDetail["status"], active: boolean }) {
  const config = {
    PAID: "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]",
    BILLED: "bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]",
    OPEN: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
  };

  const dotConfig = {
    PAID: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]",
    BILLED: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]",
    OPEN: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
  };

  return (
    <span className={cn(
      "text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-2 border uppercase tracking-widest",
      config[status]
    )}>
      <span className={cn("size-1.5 rounded-full", dotConfig[status], active && "animate-pulse")} />
      {status}
    </span>
  );
}
