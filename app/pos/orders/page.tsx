"use client";

import { useState, useCallback, useRef } from "react";

import OrdersTopBar from "@/components/custom/pos/OrdersTopBar";
import OrderListPanel from "@/components/custom/pos/OrderListPanel";
import MenuPanel from "@/components/custom/pos/MenuPanel";
import OrderDetailPanel from "@/components/custom/pos/OrderDetailPanel";
import OrderEditModal from "@/components/custom/pos/OrderEditModal";

export default function OrdersPage() {
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Use refs to store refresh callbacks from child components
  const orderListRefreshRef = useRef<(() => void) | null>(null);
  const orderDetailRefreshRef = useRef<(() => void) | null>(null);

  const handleNewOrder = useCallback((orderId: string) => {
    // Set the new order as active
    setActiveOrderId(orderId);

    // Refresh the order list to show the new order
    orderListRefreshRef.current?.();
  }, []);

  const handleItemAdded = useCallback(() => {
    // Refresh the order detail panel when an item is added
    orderDetailRefreshRef.current?.();
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <OrdersTopBar onNewOrder={handleNewOrder} />

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Orders */}
        <OrderListPanel
          activeOrderId={activeOrderId}
          onSelectOrder={setActiveOrderId}
          onRefreshReady={(refreshFn) => {
            orderListRefreshRef.current = refreshFn;
          }}
        />

        {/* Center: Menu */}
        <MenuPanel
          activeOrderId={activeOrderId}
          onItemAdded={handleItemAdded}
        />

        {/* Right: Order detail */}
        <OrderDetailPanel
          activeOrderId={activeOrderId}
          onEditOrder={() => setEditOpen(true)}
          onRefreshReady={(refreshFn) => {
            orderDetailRefreshRef.current = refreshFn;
          }}
        />
      </div>

      {/* Edit modal */}
      <OrderEditModal
        open={editOpen}
        orderId={activeOrderId}
        onClose={() => setEditOpen(false)}
        onOrderUpdated={() => {
          // Refresh both panels when order is edited
          orderListRefreshRef.current?.();
          orderDetailRefreshRef.current?.();
        }}
      />
    </div>
  );
}
