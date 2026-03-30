"use client";

import { useEffect, useState, useCallback, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Close, 
  Restaurant, 
  Delivery, 
  Add, 
  Subtract, 
  ChevronRight,
  DataBase,
  UserAvatar,
  Ticket,
  Receipt,
  WarningAlt
} from "@carbon/icons-react";
import { cn } from "@/lib/utils";

type MenuItem = {
  id: string;
  name: string;
  itemCode: string;
  price: number;
  isVeg: boolean;
  gstRate: number;
};

type CategoryWithItems = {
  categoryId: string;
  categoryName: string;
  items: MenuItem[];
};

type OrderItem = {
  menuItemId: string;
  quantity: number;
  itemName: string;
  itemCode: string;
  price: number;
  gstRate: number;
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  segment: "Retail" | "Wholesale" | "Loyal";
};

type NewOrderModalProps = {
  open: boolean;
  orderType: "DINE_IN" | "TAKEAWAY";
  onClose: () => void;
  onCreated: (orderId: string) => void;
};

export default function NewOrderModal({
  open,
  orderType,
  onClose,
  onCreated,
}: NewOrderModalProps) {
  const [tableLabel, setTableLabel] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loading, setLoading] = useState(false);

  const [browseMode, setBrowseMode] = useState<"search" | "browse">("browse");
  const [categories, setCategories] = useState<CategoryWithItems[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [searchCode, setSearchCode] = useState("");
  const [searchResults, setSearchResults] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [manualDiscountInput, setManualDiscountInput] = useState("");
  const [inventoryMap, setInventoryMap] = useState<Record<string, { currentStock: number, threshold: number }>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      if (categories.length === 0) loadCategories();
      if (customers.length === 0) loadCustomers();
      loadInventory();
    }
  }, [open, categories.length, customers.length]);

  const loadInventory = useCallback(async () => {
    try {
      const res = await fetch("/api/pos/inventory");
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, { currentStock: number, threshold: number }> = {};
        data.forEach((item: any) => {
          map[item.menuItemId] = {
            currentStock: item.currentStock,
            threshold: item.lowStockThreshold
          };
        });
        setInventoryMap(map);
      }
    } catch (error) {
      console.error("Failed to load inventory:", error);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/pos/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch("/api/pos/menu/active");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategoryId(data[0].categoryId);
        }
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    if (browseMode !== "search" || !searchCode.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await fetch(
            `/api/pos/menu/items/search?code=${encodeURIComponent(searchCode)}`
          );
          if (res.ok) {
            const items = await res.json();
            setSearchResults(items);
          }
        } catch (error) {
          console.error("Search failed:", error);
        }
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchCode, browseMode]);

  const addItem = useCallback((item: MenuItem) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [
          ...prev,
          {
            menuItemId: item.id,
            quantity: 1,
            itemName: item.name,
            itemCode: item.itemCode,
            price: item.price,
            gstRate: item.gstRate,
          },
        ];
      }
    });
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  }, []);

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    if (quantity < 1) {
      setSelectedItems((prev) =>
        prev.filter((i) => i.menuItemId !== menuItemId)
      );
      return;
    }
    setSelectedItems((prev) =>
      prev.map((i) =>
        i.menuItemId === menuItemId ? { ...i, quantity } : i
      )
    );
  }, []);

  const { subtotal, tax, discount, manualDiscount, finalTotal } = useMemo(() => {
    let sub = 0;
    let t = 0;
    let discountRate = 0;
    
    if (selectedCustomerId) {
      const c = customers.find(x => x.id === selectedCustomerId);
      if (c?.segment === "Wholesale") discountRate = 0.10;
      else if (c?.segment === "Loyal") discountRate = 0.05;
    }

    selectedItems.forEach(item => {
      const line = item.price * item.quantity;
      sub += line;
      const discountedLine = line * (1 - discountRate);
      t += discountedLine * ((item.gstRate || 5) / 100);
    });

    const d = Math.round(sub * discountRate);
    const md = (parseFloat(manualDiscountInput) || 0) * 100;
    t = Math.round(t);
    return {
      subtotal: sub,
      discount: d,
      manualDiscount: md,
      tax: t,
      finalTotal: Math.max(0, sub - d - md + t),
    };
  }, [selectedItems, customers, selectedCustomerId, manualDiscountInput]);

  async function handleCreate() {
    if (selectedItems.length === 0) return;
    if (orderType === "DINE_IN" && !tableLabel.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/pos/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          tableLabel: orderType === "DINE_IN" ? tableLabel : undefined,
          customerId: selectedCustomerId || undefined,
          manualDiscountAmount: manualDiscount,
          items: selectedItems.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to create order");
        return;
      }

      const data = await res.json();
      setTableLabel("");
      setSelectedCustomerId("");
      setSelectedItems([]);
      setSearchCode("");
      onCreated(data.orderId);
    } catch (error) {
      console.error("Failed to create order:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setTableLabel("");
    setSelectedCustomerId("");
    setSelectedItems([]);
    setSearchCode("");
    setSearchResults([]);
    onClose();
  }

  const selectedCategory = useMemo(
    () => categories.find((c) => c.categoryId === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="!max-w-[95vw] !w-[1240px] !h-[90vh] !p-0 !gap-0 flex flex-col bg-[#0a0a0a] border-neutral-800 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        {/* Header */}
        <DialogHeader className="px-8 py-6 border-b border-neutral-800 bg-[#0a0a0a] shrink-0 flex flex-row items-center justify-between z-20 space-y-0">
          <div className="flex items-center gap-4">
             <div className="size-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
               {orderType === "DINE_IN" ? <Restaurant size={24} /> : <Delivery size={24} />}
             </div>
             <div>
               <DialogTitle className="text-xl font-bold text-neutral-50 tracking-tight">
                 {orderType === "DINE_IN" ? "New Dine-In Order" : "New Takeaway Order"}
               </DialogTitle>
               <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Configure Order • Active Session</p>
             </div>
          </div>
          <button 
             onClick={handleClose}
             className="size-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all"
          >
             <Close size={20} />
          </button>
        </DialogHeader>

        {/* Body: three columns */}
        <div className="flex flex-1 min-h-0 bg-[#0a0a0a]">
          
          {/* ====== LEFT: Navigation / Categories ====== */}
          <div className="w-[200px] shrink-0 border-r border-neutral-800 flex flex-col bg-neutral-900/10">
            <div className="px-6 py-4 border-b border-neutral-800/50">
               <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                 <DataBase size={14} /> Categories
               </h4>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
               <button
                  onClick={() => setBrowseMode("search")}
                  className={cn(
                    "w-full text-left px-6 py-3.5 text-[13px] font-bold transition-all border-l-4 group flex items-center justify-between",
                    browseMode === "search" 
                      ? "bg-neutral-900 border-l-white text-white" 
                      : "border-l-transparent text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/30"
                  )}
               >
                 Search Menu
                 <Search size={16} className={cn("opacity-0 group-hover:opacity-100", browseMode === "search" && "opacity-100")} />
               </button>
               
               <div className="h-[1px] bg-neutral-800 my-2 mx-4" />
               
               {categories.map((cat) => (
                 <button
                   key={cat.categoryId}
                   onClick={() => {
                     setBrowseMode("browse");
                     setSelectedCategoryId(cat.categoryId);
                   }}
                   className={cn(
                     "w-full text-left px-6 py-4 text-[13px] font-bold transition-all border-l-4 group flex items-center justify-between",
                     browseMode === "browse" && selectedCategoryId === cat.categoryId
                       ? "bg-neutral-900 border-l-orange-500 text-neutral-50"
                       : "border-l-transparent text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/30"
                   )}
                 >
                   {cat.categoryName}
                   <span className={cn(
                     "text-[10px] font-mono tabular-nums",
                     browseMode === "browse" && selectedCategoryId === cat.categoryId ? "text-orange-500" : "text-neutral-600"
                   )}>{cat.items.length.toString().padStart(2, '0')}</span>
                 </button>
               ))}
            </div>
          </div>

          {/* ====== MIDDLE: Product Grid ====== */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
            {/* Context Header */}
            <div className="px-8 py-5 border-b border-neutral-800/50 flex items-center justify-between bg-neutral-900/5">
               <div className="flex items-center gap-3">
                 <div className="size-2 rounded-full bg-neutral-700" />
                 <h3 className="font-bold text-[14px] text-neutral-300 uppercase tracking-widest">
                   {browseMode === "search" ? "Search Results" : selectedCategory?.categoryName || "Active Menu"}
                 </h3>
               </div>
               {browseMode === "search" && (
                 <div className="relative w-64 group">
                    <Input
                       placeholder="Search Items..."
                       value={searchCode}
                       onChange={(e) => setSearchCode(e.target.value)}
                       autoFocus
                       className="h-9 bg-neutral-900 border-neutral-800 focus:border-neutral-700 pl-8 text-[12px] rounded-lg"
                    />
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-neutral-400" />
                 </div>
               )}
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
               {browseMode === "search" ? (
                 searchResults.length > 0 ? (
                   <motion.div initial="hidden" animate="visible" variants={gridVariants} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                     {searchResults.map((item) => (
                       <ModalItemCard key={item.id} item={item} onAdd={() => addItem(item)} inventory={inventoryMap[item.id]} />
                     ))}
                   </motion.div>
                 ) : searchCode.trim() ? (
                   <EmptyState icon={<Search size={40} />} title="No Results" desc={`Item matching '${searchCode}' not found.`} />
                 ) : (
                   <EmptyState icon={<DataBase size={40} />} title="Type to Search" desc="Enter product code or name to find products." />
                 )
               ) : (
                 <motion.div initial="hidden" animate="visible" variants={gridVariants} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                   {selectedCategory?.items.map((item) => (
                     <ModalItemCard key={item.id} item={item} onAdd={() => addItem(item)} inventory={inventoryMap[item.id]} />
                   ))}
                 </motion.div>
               )}
            </div>
          </div>

          {/* ====== RIGHT: Transaction Core ====== */}
          <div className="w-[340px] shrink-0 border-l border-neutral-800 flex flex-col bg-neutral-900/10 backdrop-blur-sm">
            <div className="px-6 py-6 border-b border-neutral-800/80 bg-neutral-900/20">
               <h3 className="font-bold text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-6 flex items-center justify-between">
                 Order Details <Ticket size={16} />
               </h3>
               
               <div className="space-y-5">
                 {orderType === "DINE_IN" && (
                   <div className="space-y-2">
                     <Label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Table Number</Label>
                     <div className="relative group">
                       <Input
                         placeholder="T1, Table 5, etc."
                         value={tableLabel}
                         onChange={(e) => setTableLabel(e.target.value)}
                         className="h-11 bg-neutral-950 border-neutral-800 focus:border-neutral-700 text-neutral-100 rounded-xl pl-4"
                       />
                       <Restaurant size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-700 group-focus-within:text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                   </div>
                 )}

                 <div className="space-y-2">
                   <Label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Select Customer</Label>
                   <div className="relative">
                      <select
                        className="flex h-11 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-1 text-sm text-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-700 appearance-none"
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                      >
                        <option value="">Walk-in Guest</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.phone?.slice(-4) || "XXXX"})
                          </option>
                        ))}
                      </select>
                      <UserAvatar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-700 pointer-events-none" />
                   </div>
                 </div>
               </div>
            </div>

            {/* Selected Items List */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-4">
               <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Order Items</h4>
                  <span className="font-mono text-[10px] text-neutral-700 font-bold">{selectedItems.length.toString().padStart(2, '0')} ITEMS</span>
               </div>

               {selectedItems.length === 0 ? (
                 <div className="h-40 border border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center text-center p-4">
                    <Receipt size={24} className="text-neutral-700 mb-2" />
                    <p className="text-[11px] font-bold text-neutral-600 uppercase tracking-widest">Order is Empty</p>
                 </div>
               ) : (
                 <AnimatePresence mode="popLayout">
                   {selectedItems.map((item) => (
                     <motion.div
                       layout
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, scale: 0.9 }}
                       key={item.menuItemId}
                       className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 group"
                     >
                       <div className="flex justify-between items-start mb-3">
                          <div className="min-w-0 pr-2">
                             <p className="font-bold text-[13px] text-neutral-200 group-hover:text-white transition-colors truncate">{item.itemName}</p>
                             <p className="text-[10px] font-mono text-neutral-600 mt-1 uppercase tracking-tighter">ID: {item.itemCode}</p>
                          </div>
                          <button 
                             onClick={() => removeItem(item.menuItemId)}
                             className="size-6 rounded-lg bg-neutral-800 text-neutral-500 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all"
                          >
                             <Close size={14} />
                          </button>
                       </div>

                       <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 bg-neutral-950 rounded-xl border border-neutral-800/50 p-1">
                             <button
                               onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                               className="size-7 rounded-lg bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
                             >
                               <Subtract size={14} />
                             </button>
                             <span className="w-10 text-center font-bold text-[13px] text-neutral-100 tabular-nums">
                               {item.quantity.toString().padStart(2, '0')}
                             </span>
                             <button
                               onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                               className="size-7 rounded-lg bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
                             >
                               <Add size={14} />
                             </button>
                          </div>
                          <span className="font-bold text-neutral-50 tabular-nums">
                            ₹{(item.price * item.quantity / 100).toFixed(0)}
                          </span>
                       </div>
                     </motion.div>
                   ))}
                 </AnimatePresence>
               )}
            </div>

            {/* Receipt Modal Footer */}
            <div className="p-6 border-t border-neutral-800 bg-[#0a0a0a] shadow-[0_-20px_40px_rgba(0,0,0,0.5)] z-10">
               {selectedItems.length > 0 && (
                 <div className="space-y-4 mb-6">
                    <div className="space-y-1.5 px-1">
                      <div className="flex justify-between text-[11px] font-bold text-neutral-600 uppercase tracking-widest">
                        <span>Subtotal</span>
                        <span className="text-neutral-400 tabular-nums">₹{(subtotal / 100).toFixed(2)}</span>
                      </div>
                      {(discount > 0 || manualDiscount > 0) && (
                        <div className="flex justify-between text-[11px] font-bold text-green-500 uppercase tracking-widest">
                          <span>Discounts</span>
                          <span className="tabular-nums">-₹{((discount + manualDiscount) / 100).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[11px] font-bold text-neutral-600 uppercase tracking-widest">
                        <span>Taxes</span>
                        <span className="text-neutral-400 tabular-nums">₹{(tax / 100).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="border-t border-dashed border-neutral-800 pt-4 flex justify-between items-end">
                       <div className="space-y-0.5">
                         <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Total Amount</p>
                         <h3 className="text-3xl font-bold tracking-tighter text-neutral-50 tabular-nums">₹{(finalTotal / 100).toFixed(0)}</h3>
                       </div>
                    </div>
                 </div>
               )}
               
               <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="h-12 rounded-2xl bg-neutral-900 border-neutral-800 hover:bg-neutral-800 hover:text-white text-neutral-500 font-bold text-[11px] uppercase tracking-[0.2em]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={loading || selectedItems.length === 0 || (orderType === "DINE_IN" && !tableLabel.trim())}
                    className={cn(
                      "h-12 rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] transition-all",
                      loading || selectedItems.length === 0 ? "bg-neutral-800 text-neutral-600" : "bg-neutral-50 hover:bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95"
                    )}
                  >
                    {loading ? (
                      <div className="size-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Create Order"
                    )}
                  </Button>
               </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── UI Components ── */

const gridVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } }
};

function ModalItemCard({ 
  item, 
  onAdd, 
  inventory 
}: { 
  item: MenuItem; 
  onAdd: () => void; 
  inventory: { currentStock: number, threshold: number } | undefined;
}) {
  const isOutOfStock = inventory && inventory.currentStock <= 0;
  
  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, y: 10, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 30 } }
      }}
      onClick={onAdd}
      disabled={isOutOfStock}
      className={cn(
        "group relative p-3.5 rounded-xl border text-left flex flex-col justify-between h-36 transition-all duration-300 overflow-hidden",
        isOutOfStock 
          ? "bg-neutral-950 border-neutral-800/50 opacity-50 grayscale" 
          : "bg-neutral-900/40 border-neutral-800 hover:bg-neutral-900 hover:border-neutral-700 hover:shadow-xl active:scale-95"
      )}
    >
      <div className="absolute -right-6 -top-6 size-24 bg-neutral-100/5 blur-3xl rounded-full group-hover:bg-neutral-100/10 transition-colors" />
      
      <div className="relative z-10 flex justify-between items-start">
         <div className={cn(
           "size-2 rounded-full",
           item.isVeg ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
         )} />
         <span className="text-[10px] font-mono font-bold text-neutral-600 uppercase tracking-tighter">{item.itemCode}</span>
      </div>

      <div className="relative z-10 mt-2">
         <h4 className="font-bold text-[14px] text-neutral-200 group-hover:text-white leading-snug line-clamp-2">{item.name}</h4>
      </div>

      <div className="relative z-10 pt-3 border-t border-neutral-800/50 flex items-center justify-between">
         <span className="font-bold text-base text-neutral-50 tabular-nums">₹{(item.price / 100).toFixed(0)}</span>
         
         <div className="flex items-center gap-2">
            {inventory && (
              <span className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-tighter",
                isOutOfStock ? "bg-red-500/10 text-red-500 border-red-500/20" :
                inventory.currentStock <= inventory.threshold ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                "bg-green-500/10 text-green-500 border-green-500/20"
              )}>
                {isOutOfStock ? "OUT OF STOCK" : `STOCK: ${inventory.currentStock}`}
              </span>
            )}
            <div className="size-7 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-500 group-hover:bg-white group-hover:text-black transition-all">
               <Add size={16} />
            </div>
         </div>
      </div>
    </motion.button>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center py-20 px-12 text-center opacity-40">
       <div className="mb-6 text-neutral-600">{icon}</div>
       <h3 className="text-base font-bold text-neutral-400 uppercase tracking-[0.2em] mb-3">{title}</h3>
       <p className="text-[13px] text-neutral-600 max-w-[280px] leading-relaxed font-medium">{desc}</p>
    </div>
  );
}