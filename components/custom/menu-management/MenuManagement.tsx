"use client";

import { useEffect, useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Catalog, 
  Add, 
  Search, 
  CheckmarkFilled, 
  MisuseOutline,
  View,
  Information,
  Filter,
  Package,
  Product
} from "@carbon/icons-react";
import { cn } from "@/lib/utils";

import AddCategory from "./AddCategory";
import AddMenuItem from "./AddMenuItem";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  itemCode: string;
};

type MenuData = {
  categoryId: string;
  categoryName: string;
  items: MenuItem[];
}[];

const softSpringEasing = [0.25, 1.1, 0.4, 1] as [number, number, number, number];

export default function MenuManagement() {
  const [menu, setMenu] = useState<MenuData>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");

  async function loadMenu(showLoader = false) {
    if (showLoader) setInitialLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pos/menu/items");
      if (!res.ok) throw new Error("Failed to load menu");
      const data = await res.json();
      if (Array.isArray(data)) setMenu(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failure");
    } finally {
      if (showLoader) setInitialLoading(false);
    }
  }

  async function toggleAvailability(itemId: string) {
    setMenu((prev) => prev.map(cat => ({
      ...cat,
      items: cat.items.map(item => item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item)
    })));

    try {
      const res = await fetch(`/api/pos/menu/items/${itemId}/availability`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      startTransition(() => loadMenu(false));
    } catch (err) {
      // Revert on error
      setMenu((prev) => prev.map(cat => ({
        ...cat,
        items: cat.items.map(item => item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item)
      })));
    }
  }

  function addItemOptimistically(newItem: MenuItem, categoryId: string) {
    setMenu((prev) => prev.map(cat => 
      cat.categoryId === categoryId ? { ...cat, items: [...cat.items, newItem] } : cat
    ));
  }

  useEffect(() => { loadMenu(true); }, []);

  if (initialLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-neutral-500 gap-3">
        <div className="animate-spin size-10 border-4 border-neutral-900 border-t-neutral-500 rounded-full" />
        <p className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-60">Loading Menu Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto dark">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-neutral-800 pb-8">
        <div>
          <h2 className="text-3xl font-semibold text-neutral-50 tracking-tight flex items-center gap-3">
            <Product size={32} className="text-neutral-400" />
            Menu Management
          </h2>
          <p className="text-neutral-400 text-sm mt-1">Configure and manage your food items and categories.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 min-w-[200px] group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-neutral-300 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600 focus:bg-neutral-900 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <AddCategory onSuccess={() => loadMenu(false)} />
            <AddMenuItem
              categories={menu.map((cat) => ({ id: cat.categoryId, name: cat.categoryName }))}
              onSuccess={() => loadMenu(false)}
              onOptimisticAdd={addItemOptimistically}
            />
          </div>
        </div>
      </div>

      {menu.length === 0 ? (
        <div className="py-24 text-center border-2 border-dashed border-neutral-800 rounded-3xl text-neutral-500 bg-neutral-900/10">
          <Package size={48} className="mx-auto mb-4 opacity-10" />
          <p className="text-lg font-medium text-neutral-400">Your menu is currently empty.</p>
          <p className="text-sm text-neutral-600 mt-1">Begin by adding your first category or food item.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {menu.map((category, catIdx) => {
            const filteredItems = category.items.filter(i => 
              i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              i.itemCode.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (searchQuery && filteredItems.length === 0) return null;

            return (
              <motion.div 
                key={category.categoryId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: catIdx * 0.1, ease: softSpringEasing }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-[0.2em]">
                    {category.categoryName} 
                    <span className="ml-3 font-mono text-[10px] text-neutral-700 font-bold bg-neutral-900/50 px-2.5 py-1 rounded-full border border-neutral-800/30">
                       {filteredItems.length.toString().padStart(2, '0')} PRODUCTS
                    </span>
                  </h3>
                  <div className="h-px flex-1 bg-neutral-800/30" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
                  <AnimatePresence>
                    {filteredItems.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: idx * 0.03 }}
                        className={cn(
                          "group relative bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700/80 rounded-2xl p-4.5 transition-all duration-300 flex flex-col min-h-[160px] h-full overflow-hidden",
                          !item.isAvailable && 'opacity-50 grayscale hover:opacity-70 hover:grayscale-0'
                        )}
                      >
                        {/* Decorative Background Glow */}
                        <div className="absolute -right-6 -top-6 size-20 bg-neutral-100/5 blur-3xl rounded-full group-hover:bg-neutral-100/10 transition-colors" />

                        {/* Top Controls */}
                        <div className="flex justify-between items-center mb-4 relative z-10">
                          <div className={cn(
                            "size-2 rounded-full",
                            item.isVeg ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                          )} />
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[9px] font-bold uppercase tracking-widest",
                              item.isAvailable ? "text-green-500/80" : "text-neutral-600"
                            )}>
                              {item.isAvailable ? "Available" : "Stock Out"}
                            </span>
                            <Switch 
                              checked={item.isAvailable} 
                              onCheckedChange={() => toggleAvailability(item.id)}
                              className="scale-75 origin-right"
                            />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-2 relative z-10">
                          <h4 className="text-[14px] font-bold text-neutral-200 group-hover:text-white leading-snug tracking-tight transition-colors">
                            {item.name}
                          </h4>
                          <span className="inline-block text-[10px] text-neutral-600 font-mono font-bold uppercase tracking-tighter bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                            ID: {item.itemCode}
                          </span>
                        </div>

                        {/* Action Bar / Pricing */}
                        <div className="mt-6 pt-4 border-t border-neutral-800/50 flex justify-between items-end relative z-10">
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Pricing</p>
                            <span className="text-[17px] font-bold text-neutral-50 tracking-tighter tabular-nums">
                              ₹{(item.price / 100).toFixed(0)}
                            </span>
                          </div>
                          
                          <button className="size-8 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 text-neutral-500 hover:text-neutral-200 flex items-center justify-center transition-all">
                             <View size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
