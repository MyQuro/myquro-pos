"use client";

import { useEffect, useState, useCallback, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

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

type OrderItem = {
  menuItemId: string;
  quantity: number;
  itemName: string;
  itemCode: string;
  price: number;
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
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
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
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open && categories.length === 0) {
      loadCategories();
    }
  }, [open, categories.length]);

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

  // Optimistic UI: Add item immediately
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
          },
        ];
      }
    });
    setSearchCode("");
    setSearchResults([]);
  }, []);

  // Optimistic UI: Remove item immediately
  const removeItem = useCallback((menuItemId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  }, []);

  // Optimistic UI: Update quantity immediately
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

  // Memoize total calculation
  const total = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [selectedItems]
  );

  async function handleCreate() {
    if (selectedItems.length === 0) {
      alert("Please add at least one item to the order");
      return;
    }

    if (orderType === "DINE_IN" && !tableLabel.trim()) {
      alert("Please enter a table label");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/pos/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          tableLabel: orderType === "DINE_IN" ? tableLabel : undefined,
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
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

      // Reset form
      setTableLabel("");
      setCustomerName("");
      setCustomerPhone("");
      setSelectedItems([]);
      setSearchCode("");

      // Optimistic UI: Close modal and notify immediately
      onCreated(data.orderId);
    } catch (error) {
      console.error("Failed to create order:", error);
      alert("Failed to create order");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setTableLabel("");
    setCustomerName("");
    setCustomerPhone("");
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
        className="!max-w-[95vw] !w-[1200px] !h-[85vh] !p-0 !gap-0 flex flex-col"
        style={{ maxWidth: "95vw", width: 1200, height: "85vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="text-xl font-semibold">
            {orderType === "DINE_IN"
              ? "New Dine-In Order"
              : "New Takeaway Order"}
          </h2>
        </div>

        {/* Body: two columns */}
        <div className="flex flex-1 min-h-0">
          {/* ====== LEFT: Menu Browser ====== */}
          <div className="flex-1 flex flex-col min-w-0 border-r">
            {/* Tabs */}
            <div className="flex gap-2 px-4 py-3 bg-gray-50 border-b shrink-0">
              <Button
                size="sm"
                variant={browseMode === "browse" ? "default" : "outline"}
                onClick={() => setBrowseMode("browse")}
              >
                Browse by Category
              </Button>
              <Button
                size="sm"
                variant={browseMode === "search" ? "default" : "outline"}
                onClick={() => setBrowseMode("search")}
              >
                Search by Code
              </Button>
            </div>

            {/* Search content */}
            {browseMode === "search" && (
              <div className="flex-1 flex flex-col p-4 min-h-0">
                <div className="mb-3 shrink-0">
                  <Input
                    placeholder="Enter item code to search..."
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    autoFocus
                  />
                  {isPending && (
                    <p className="text-sm text-gray-500 mt-1">Searching...</p>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {searchResults.map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          onAdd={() => addItem(item)}
                        />
                      ))}
                    </div>
                  ) : searchCode.trim() ? (
                    <p className="text-gray-500 text-sm text-center py-12">
                      No items found for &quot;{searchCode}&quot;
                    </p>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-12">
                      Type an item code above to search
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Browse content */}
            {browseMode === "browse" && (
              <div className="flex-1 flex min-h-0">
                {/* Category list */}
                <div className="w-44 shrink-0 overflow-y-auto border-r bg-gray-50">
                  {loadingCategories ? (
                    <p className="p-4 text-sm text-gray-500">Loading…</p>
                  ) : categories.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500">No categories</p>
                  ) : (
                    categories.map((cat) => (
                      <button
                        key={cat.categoryId}
                        onClick={() => setSelectedCategoryId(cat.categoryId)}
                        className={`w-full text-left px-4 py-3 text-sm border-b transition-colors ${
                          selectedCategoryId === cat.categoryId
                            ? "bg-blue-50 border-l-4 border-l-blue-500 font-semibold"
                            : "hover:bg-gray-100 border-l-4 border-l-transparent"
                        }`}
                      >
                        {cat.categoryName}
                        <span className="block text-xs text-gray-400 mt-0.5">
                          {cat.items.length} items
                        </span>
                      </button>
                    ))
                  )}
                </div>

                {/* Item grid */}
                <div className="flex-1 overflow-y-auto p-4">
                  {selectedCategory ? (
                    selectedCategory.items.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-12">
                        No items in this category
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                        {selectedCategory.items.map((item) => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            onAdd={() => addItem(item)}
                          />
                        ))}
                      </div>
                    )
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-12">
                      Select a category
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ====== RIGHT: Order Summary ====== */}
          <div className="w-80 shrink-0 flex flex-col bg-white">
            <div className="px-4 py-3 border-b bg-gray-50 shrink-0">
              <h3 className="font-semibold">Order Details</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Fields */}
              <div className="space-y-3">
                {orderType === "DINE_IN" && (
                  <div>
                    <Label className="text-sm">Table Label *</Label>
                    <Input
                      className="mt-1"
                      placeholder="e.g. T1, Table 5"
                      value={tableLabel}
                      onChange={(e) => setTableLabel(e.target.value)}
                    />
                  </div>
                )}
                <div>
                  <Label className="text-sm">Customer Name</Label>
                  <Input
                    className="mt-1"
                    placeholder="Optional"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm">Customer Phone</Label>
                  <Input
                    className="mt-1"
                    placeholder="Optional"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Item list */}
              <div>
                <p className="text-sm font-semibold mb-2">
                  Items ({selectedItems.length})
                </p>

                {selectedItems.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg py-10 text-center text-gray-400 text-sm">
                    No items added yet
                    <br />
                    <span className="text-xs">
                      Click items from the menu to add
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedItems.map((item) => (
                      <div
                        key={item.menuItemId}
                        className="rounded-lg border p-3 bg-gray-50 text-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {item.itemName}
                            </p>
                            <p className="text-xs text-gray-500">
                              ₹{(item.price / 100).toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.menuItemId)}
                            className="text-red-400 hover:text-red-600 text-xs shrink-0 transition-colors"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0"
                              onClick={() =>
                                updateQuantity(
                                  item.menuItemId,
                                  item.quantity - 1
                                )
                              }
                            >
                              −
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0"
                              onClick={() =>
                                updateQuantity(
                                  item.menuItemId,
                                  item.quantity + 1
                                )
                              }
                            >
                              +
                            </Button>
                          </div>
                          <span className="font-semibold">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4 space-y-3 bg-gray-50 shrink-0">
              {selectedItems.length > 0 && (
                <div className="flex justify-between items-center bg-white rounded-lg border-2 border-blue-200 px-4 py-3">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatPrice(total)}
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={loading || selectedItems.length === 0}
                  className="flex-1"
                >
                  {loading ? (
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
                      Creating…
                    </>
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

/* ── reusable item card ── */

function ItemCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="border rounded-lg p-4 text-left hover:bg-blue-50 hover:border-blue-300 transition-colors"
    >
      <p className="font-medium text-sm leading-tight">
        {item.name}
        {item.isVeg && (
          <span className="ml-1.5 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
            VEG
          </span>
        )}
      </p>
      <p className="text-xs text-gray-400 mt-1">{item.itemCode}</p>
      <p className="font-semibold text-blue-600 mt-2">
        {formatPrice(item.price)}
      </p>
    </button>
  );
}

function formatPrice(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}