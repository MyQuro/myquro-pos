"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Add, Close } from "@carbon/icons-react";
import { cn } from "@/lib/utils";

type MenuPanelProps = {
  activeOrderId: string | null;
  onItemAdded?: () => void; // Callback to refresh order details
};

type MenuItem = {
  id: string;
  name: string;
  itemCode: string;
  price: number;
  isVeg: boolean;
};

type CategoryWithItems = {
  categoryId: string;
  categoryName: string;
  items: MenuItem[];
};

export default function MenuPanel({ activeOrderId, onItemAdded }: MenuPanelProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCode, setSearchCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pos/menu/items");
      if (res.ok) {
        const data: CategoryWithItems[] = await res.json();
        // Flatten the grouped data into a single list of items
        const flatItems: MenuItem[] = data.flatMap(category =>
          category.items.filter(item => item.id) // Only items with valid ids
        );
        setItems(flatItems);
      }
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const searchByCode = useCallback(
    async (code: string) => {
      if (!code) {
        fetchItems();
        return;
      }

      startTransition(async () => {
        try {
          const res = await fetch(
            `/api/pos/menu/items/search?code=${encodeURIComponent(code)}`
          );
          if (res.ok) {
            const data = await res.json();
            setItems(data);
          }
        } catch (error) {
          console.error("Search failed:", error);
        }
      });
    },
    [fetchItems]
  );

  const addItem = useCallback(
    async (menuItemId: string) => {
      if (!activeOrderId) return;

      // Optimistic UI: Mark item as adding
      setAddingItems((prev) => new Set(prev).add(menuItemId));

      try {
        // Background processing
        const response = await fetch(`/api/pos/orders/${activeOrderId}/items`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            menuItemId,
            quantity: 1,
          }),
        });

        if (response.ok) {
          // Notify parent to refresh order details
          onItemAdded?.();
        } else {
          const error = await response.json();
          console.error("Failed to add item:", error);
          alert(error.error || "Failed to add item to order");
        }
      } catch (error) {
        console.error("Failed to add item:", error);
        alert("Failed to add item to order");
      } finally {
        // Remove optimistic state
        setAddingItems((prev) => {
          const next = new Set(prev);
          next.delete(menuItemId);
          return next;
        });
      }
    },
    [activeOrderId, onItemAdded]
  );

  return (
    <div className="w-full lg:flex-1 shrink-0 flex flex-col bg-[#0a0a0a] min-h-[60vh] lg:min-h-0 border-b lg:border-b-0 border-neutral-800">
      {/* Header with Search */}
      <div className="p-6 border-b border-neutral-800/50 bg-[#0a0a0a] shrink-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-neutral-900 size-10 rounded-xl border border-neutral-800 flex items-center justify-center text-neutral-400">
            <Search size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-lg tracking-tight text-neutral-50 leading-none">Menu Explorer</h2>
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mt-1.5">Quick Menu Access</p>
          </div>
          {!activeOrderId && (
            <span className="font-bold text-[10px] text-orange-400 bg-orange-400/10 px-2.5 py-1 rounded-full ml-auto border border-orange-400/20 uppercase tracking-tighter">
              Session Inactive
            </span>
          )}
        </div>
        <div className="relative group">
          <Input
            placeholder="Search items..."
            value={searchCode}
            onChange={(e) => {
              setSearchCode(e.target.value);
              searchByCode(e.target.value);
            }}
            disabled={!activeOrderId}
            className="bg-neutral-900 border-neutral-800 focus:border-neutral-700 h-12 rounded-2xl pl-12 transition-all placeholder:text-neutral-600 text-neutral-200"
          />
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-neutral-400 transition-colors" />
          {searchCode && (
            <button
              title="Clear Search"
              onClick={() => {
                setSearchCode("");
                fetchItems();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-neutral-800 hover:bg-neutral-700 size-6 rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition-all"
            >
              <Close size={14} />
            </button>
          )}
        </div>
        {isPending && (
          <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
            <div className="size-3 border-2 border-neutral-800 border-t-neutral-500 rounded-full animate-spin" />
            Searching items...
          </div>
        )}
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        {!activeOrderId && (
          <div className="h-full flex flex-col items-center justify-center opacity-40 py-12">
            <Close size={48} className="text-neutral-600 mb-6" />
            <h3 className="text-base font-bold text-neutral-400 uppercase tracking-[0.2em] mb-2">Select an Order</h3>
            <p className="text-[13px] text-neutral-600 max-w-[200px] text-center">Please select or create an order to add items.</p>
          </div>
        )}

        {activeOrderId && loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
            <div className="size-10 border-4 border-neutral-900 border-t-neutral-500 rounded-full animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-600">Loading Menu</p>
          </div>
        )}

        {activeOrderId && !loading && items.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 py-12">
            <Search size={48} className="text-neutral-600 mb-6" />
            <h3 className="text-base font-bold text-neutral-500 uppercase tracking-widest mb-2">No Items Found</h3>
            <p className="text-[13px] text-neutral-600">No items matching "{searchCode}"</p>
          </div>
        )}

        {activeOrderId && !loading && items.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
            }}
            className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4"
          >
            {items.map((item, index) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onAdd={() => addItem(item.id)}
                isAdding={addingItems.has(item.id)}
                index={index}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function MenuItemCard({
  item,
  onAdd,
  isAdding,
  index,
}: {
  item: MenuItem;
  onAdd: () => void;
  isAdding: boolean;
  index: number;
}) {
  const price = typeof item.price === "number" && !isNaN(item.price) ? item.price : 0;
  const rupees = Math.floor(price / 100);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.95, y: 15 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
      }}
      onClick={onAdd}
      className={cn(
        "group relative border border-neutral-800 rounded-xl p-3 flex flex-col gap-2.5 bg-neutral-900/40 hover:bg-neutral-900 hover:border-neutral-700/80 transition-all duration-300 cursor-pointer overflow-hidden min-h-[130px] h-full",
        isAdding && "scale-95 opacity-80"
      )}
    >
      {/* Decorative Background Glow */}
      <div className="absolute -right-6 -top-6 size-20 bg-neutral-100/5 blur-3xl rounded-full group-hover:bg-neutral-100/10 transition-colors" />

      {/* Top Controls */}
      <div className="flex justify-between items-center relative z-10">
        <div className={cn(
          "size-2 rounded-full",
          item.isVeg ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
        )} />
        <span className="text-[10px] font-mono font-bold tracking-tighter text-neutral-600 uppercase group-hover:text-neutral-500 transition-colors bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
          {item.itemCode || "N/A"}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2 relative z-10">
        <h4 className="font-bold text-[14px] leading-snug line-clamp-2 text-neutral-200 group-hover:text-white transition-colors tracking-tight">
          {item.name || "Unnamed Item"}
        </h4>
      </div>

      {/* Footer (Price + Add Action) */}
      <div className="flex items-end justify-between pt-3 border-t border-neutral-800/50 relative z-10">
        <div className="space-y-0.5">
           <p className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest">Rate</p>
           <span className="font-bold text-[15px] text-neutral-50 tabular-nums tracking-tighter leading-none">
             ₹{rupees}
           </span>
        </div>

        <div className={cn(
          "size-7 rounded-lg flex items-center justify-center transition-all duration-300 active:scale-90",
          isAdding ? "bg-white text-black" : "bg-neutral-950 border border-neutral-800 text-neutral-500 group-hover:bg-neutral-50 group-hover:text-black group-hover:border-transparent shadow-lg"
        )}>
          {isAdding ? (
            <div className="size-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <Add size={16} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
