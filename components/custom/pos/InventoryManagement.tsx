"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  InventoryManagement as InventoryIcon, 
  WarningAlt, 
  CheckmarkFilled, 
  Add,
  ChartLine,
  Box,
  Percentage,
  Currency,
  ChevronRight
} from "@carbon/icons-react";
import { motion } from "framer-motion";

type InventoryItem = {
  id: string;
  menuItemId: string;
  itemName: string;
  category: string;
  price: number;
  currentStock: number;
  lowStockThreshold: number;
  lastRestockedAt: string | null;
  lastUnitCost: number | null;
};

type MenuItem = {
  id: string;
  name: string;
};

const softSpringEasing = "cubic-bezier(0.25, 1.1, 0.4, 1)";

export default function InventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [selectedMenuItem, setSelectedMenuItem] = useState("");
  const [initialStock, setInitialStock] = useState("0");
  const [threshold, setThreshold] = useState("10");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInventory();
    fetchMenuItems();
  }, []);

  async function fetchInventory() {
    setLoading(true);
    try {
      const res = await fetch("/api/pos/inventory");
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMenuItems() {
    try {
      const res = await fetch("/api/pos/menu/items"); 
      if (res.ok) {
        const data = await res.json();
        const flatItems: MenuItem[] = [];
        data.forEach((cat: any) => {
          if (cat.items && Array.isArray(cat.items)) {
            cat.items.forEach((item: any) => flatItems.push(item));
          }
        });
        setMenuItems(flatItems);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddInventory(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMenuItem) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/pos/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuItemId: selectedMenuItem,
          initialStock: parseInt(initialStock, 10),
          threshold: parseInt(threshold, 10),
        }),
      });

      if (res.ok) {
        fetchInventory();
        setIsModalOpen(false);
        setSelectedMenuItem("");
        setInitialStock("0");
        setThreshold("10");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  const lowStockItems = inventory.filter(i => i.currentStock <= i.lowStockThreshold);

  return (
    <div className="space-y-8 max-w-6xl mx-auto dark">
      {/* Header Area */}
      <div className="flex justify-between items-end border-b border-neutral-800 pb-6">
        <div>
          <h2 className="text-3xl font-semibold text-neutral-50 tracking-tight">Inventory</h2>
          <p className="text-neutral-400 text-sm mt-1">Real-time stock tracking and profitability analysis.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-neutral-50 text-black hover:bg-neutral-200 rounded-xl px-6 h-11 flex gap-2 font-medium transition-all active:scale-95"
        >
          <Add size={20} />
          Track New Item
        </Button>
      </div>

      {/* Alert Banner */}
      {lowStockItems.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-4"
        >
          <div className="size-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
            <WarningAlt size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-red-400 font-medium">Critical Stock Shortage</h3>
            <p className="text-red-400/70 text-sm">{lowStockItems.length} items have breached their safety threshold.</p>
          </div>
          <Button variant="ghost" className="text-red-400 hover:bg-red-500/10">View Details</Button>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Items" value={inventory.length.toString()} icon={<Box size={20} />} />
        <StatsCard title="In Stock" value={(inventory.length - lowStockItems.length).toString()} icon={<CheckmarkFilled size={20} />} trend="up" />
        <StatsCard title="Low Stock" value={lowStockItems.length.toString()} icon={<WarningAlt size={20} />} trend={lowStockItems.length > 0 ? "down" : undefined} />
        <StatsCard title="Avg Margin" value="32.4%" icon={<Percentage size={20} />} />
      </div>

      {/* Inventory List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-500 gap-3">
            <div className="animate-spin size-6 border-2 border-neutral-700 border-t-neutral-400 rounded-full" />
            <p className="text-sm font-light">Analyzing supply chain data...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-neutral-800 rounded-3xl text-neutral-500">
            <InventoryIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p>Your warehouse is currently empty.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/20 backdrop-blur-sm">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/40">
                  <th className="px-6 py-4 font-medium text-neutral-400 uppercase tracking-wider text-[10px]">Item Details</th>
                  <th className="px-6 py-4 font-medium text-neutral-400 uppercase tracking-wider text-[10px] text-right">Pricing</th>
                  <th className="px-6 py-4 font-medium text-neutral-400 uppercase tracking-wider text-[10px] text-right">Latest Cost</th>
                  <th className="px-6 py-4 font-medium text-neutral-400 uppercase tracking-wider text-[10px] text-right">Stock Level</th>
                  <th className="px-6 py-4 font-medium text-neutral-400 uppercase tracking-wider text-[10px] text-right">Profitability</th>
                  <th className="px-6 py-4 font-medium text-neutral-400 uppercase tracking-wider text-[10px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {inventory.map((i) => {
                  const isLow = i.currentStock <= i.lowStockThreshold;
                  const margin = i.lastUnitCost && i.price > 0 ? (((i.price - i.lastUnitCost) / i.price) * 100) : 0;
                  
                  return (
                    <tr key={i.id} className="group hover:bg-neutral-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-neutral-100">{i.itemName}</div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">{i.category}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-neutral-300">
                        ₹{(i.price / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-neutral-500 tabular-nums">
                        {i.lastUnitCost ? `₹${(i.lastUnitCost / 100).toFixed(2)}` : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`font-bold tabular-nums ${isLow ? 'text-red-500' : 'text-green-500'}`}>
                          {i.currentStock}
                        </div>
                        <div className="text-[10px] text-neutral-600">Limit: {i.lowStockThreshold}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {margin !== 0 ? (
                          <div className={`inline-flex items-center gap-1 font-semibold tabular-nums ${margin > 30 ? 'text-green-500' : 'text-amber-500'}`}>
                            {margin.toFixed(1)}%
                            <ChartLine size={12} />
                          </div>
                        ) : <span className="text-neutral-700">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-tight
                          ${isLow ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                          <div className={`size-1.5 rounded-full ${isLow ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                          {isLow ? 'Low Stock' : 'Stable'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#0a0a0a] border-neutral-800 text-neutral-50 rounded-2xl max-w-sm">
          <DialogHeader className="border-b border-neutral-800 pb-4">
            <DialogTitle className="text-xl font-semibold tracking-tight">Track Inventory</DialogTitle>
            <DialogDescription className="text-neutral-400">Initialize stock tracking for a menu item.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddInventory} className="space-y-5 py-6">
            <div className="space-y-2 text-sm">
              <Label className="text-neutral-400">Menu Item</Label>
              <select
                className="flex h-11 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm focus:border-neutral-500 transition-all outline-none"
                value={selectedMenuItem}
                onChange={(e) => setSelectedMenuItem(e.target.value)}
                required
              >
                <option value="" disabled>Select an item...</option>
                {menuItems.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-sm">
                <Label className="text-neutral-400">Initial Stock</Label>
                <Input type="number" value={initialStock} onChange={(e) => setInitialStock(e.target.value)} required className="bg-neutral-900 border-neutral-800 h-11 rounded-xl" />
              </div>
              <div className="space-y-2 text-sm">
                <Label className="text-neutral-400">Threshold</Label>
                <Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} required className="bg-neutral-900 border-neutral-800 h-11 rounded-xl" />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 border-neutral-800 text-neutral-400 h-11 rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedMenuItem} className="flex-1 bg-neutral-50 text-black font-medium h-11 rounded-xl">
                {isSubmitting ? "Linking..." : "Initialize"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatsCard({ title, value, icon, trend }: { title: string; value: string; icon: React.ReactNode; trend?: "up" | "down" }) {
  return (
    <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between text-neutral-400 mb-2">
        <span className="text-xs font-medium uppercase tracking-wider">{title}</span>
        {icon}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-semibold text-neutral-50 leading-none">{value}</span>
        {trend && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${trend === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {trend === 'up' ? 'SAFE' : 'RISK'}
          </span>
        )}
      </div>
    </div>
  );
}
