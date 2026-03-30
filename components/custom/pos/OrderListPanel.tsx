"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { Restaurant, Delivery, List } from "@carbon/icons-react";

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

const softSpringEasing = [0.25, 1.1, 0.4, 1] as [number, number, number, number];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10, y: 5 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
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

  useEffect(() => {
    onRefreshReady?.(fetchOrders);
  }, [fetchOrders, onRefreshReady]);

  return (
    <div className="w-full lg:w-[280px] lg:min-w-[280px] lg:max-w-[280px] shrink-0 border-b lg:border-b-0 lg:border-r border-neutral-800 bg-[#0a0a0a] h-[40vh] lg:h-full flex flex-col overflow-hidden">
      <div className="p-5 border-b border-neutral-800/50 flex items-center justify-between shrink-0 bg-[#0a0a0a] z-10">
        <div className="flex items-center gap-2">
          <List size={18} className="text-neutral-500" />
          <span className="font-semibold text-base text-neutral-50 tracking-tight">Active Orders</span>
        </div>
        <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide relative p-3 space-y-2">
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-40">
            <div className="animate-spin h-5 w-5 border-2 border-neutral-700 border-t-neutral-400 rounded-full" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">Updating List</p>
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="py-20 text-center opacity-30 px-6">
             <List size={40} className="mx-auto mb-3" />
             <p className="text-sm font-medium">All Orders Processed</p>
             <p className="text-[11px] mt-1">Ready for new orders</p>
          </div>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-2"
        >
          <AnimatePresence mode="popLayout">
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                active={order.id === activeOrderId}
                onClick={() => onSelectOrder(order.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
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
  const isDineIn = order.orderType === "DINE_IN";
  
  return (
    <motion.div
      variants={itemVariants}
      layout
      onClick={onClick}
      className={cn(
        "group relative px-3 py-2.5 cursor-pointer rounded-lg text-sm transition-all duration-300 border",
        active 
          ? "bg-neutral-50 shadow-[0_10px_30px_rgba(255,255,255,0.05)] border-transparent" 
          : "bg-transparent border-neutral-800/50 hover:border-neutral-700 hover:bg-neutral-900/50"
      )}
    >
      {/* Decorative pulse for active items */}
      {active && (
        <motion.div 
          layoutId="active-pill" 
          className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-black rounded-r-full"
        />
      )}

      <div className="flex justify-between items-start mb-1.5 relative z-10">
        <div className="flex items-center gap-2.5">
           <div className={cn(
             "flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-300",
             active ? "bg-neutral-200 text-black border border-black/5" : "bg-neutral-900 text-neutral-500 border border-neutral-800 group-hover:text-neutral-300"
           )}>
              {isDineIn ? <Restaurant size={14} /> : <Delivery size={14} />}
           </div>
          <div className="flex flex-col">
            <span className={cn(
              "font-bold text-[13px] tracking-tight transition-colors duration-300",
              active ? "text-neutral-950" : "text-neutral-200 group-hover:text-neutral-50"
            )}>
              {isDineIn
                ? order.tableLabel || "Dine-In"
                : order.orderNumber || "Takeaway"}
            </span>
            <span className={cn(
              "text-[10px] font-mono tracking-widest transition-colors duration-300",
              active ? "text-neutral-600" : "text-neutral-500"
            )}>
              ORDER ID: {order.id.slice(0, 4).toUpperCase()}
            </span>
          </div>
        </div>

        <StatusBadge status={order.status} active={active} />
      </div>

      <div className="flex justify-between items-center text-[10px] font-semibold mt-2.5 relative z-10 pl-11">
        <span className={cn("transition-colors duration-300", active ? "text-neutral-500" : "text-neutral-600")}>
          {new Date(order.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>

        {order.total != null && (
          <span className={cn("text-xs transition-colors duration-300 font-bold", active ? "text-black" : "text-neutral-400 group-hover:text-neutral-200")}>
            ₹{(order.total / 100).toFixed(0)}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function StatusBadge({ status, active }: { status: OrderSummary["status"], active: boolean }) {
  const styles = {
    PAID: active ? "bg-green-100 text-green-800 border-green-200" : "bg-green-500/10 text-green-500 border-green-500/20",
    BILLED: active ? "bg-orange-100 text-orange-800 border-orange-200" : "bg-orange-500/10 text-orange-500 border-orange-500/20",
    OPEN: active ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-blue-500/10 text-blue-500 border-blue-500/20",
  }[status];

  return (
    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border transition-colors duration-300 uppercase tracking-tighter", styles)}>
       {status}
    </span>
  );
}
