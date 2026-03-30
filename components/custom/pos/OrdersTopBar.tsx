"use client";

import { useState, useEffect } from "react";
import NewOrderActions from "./NewOrderActions";
import { motion } from "framer-motion";
import { Time, Flash } from "@carbon/icons-react";

type OrdersTopBarProps = {
  onNewOrder: (orderId: string) => void;
};

export default function OrdersTopBar({ onNewOrder }: OrdersTopBarProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="h-16 px-6 border-b border-neutral-800 bg-[#0a0a0a] flex items-center justify-between z-40 sticky top-0 backdrop-blur-md"
    >
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
           <Flash size={18} />
        </div>
        <span className="text-xl font-semibold tracking-tight text-neutral-50">Order Management</span>
      </div>

      <div className="flex items-center gap-6">
        <NewOrderActions onCreated={onNewOrder} />
        <Clock />
      </div>
    </motion.div>
  );
}

function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-800 shadow-inner shadow-black/20">
      <Time size={16} className="text-neutral-500" />
      <span className="text-[14px] font-semibold text-neutral-300 min-w-[50px] inline-block text-center tabular-nums">
        {time || "--:--"}
      </span>
    </div>
  );
}
