"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

import AddCategory from "./AddCategory";
import AddMenuItem from "./AddMenuItem";

type MenuData = {
  categoryId: string;
  categoryName: string;
  items: {
    id: string;
    name: string;
    price: number;
    isVeg: boolean;
    isAvailable: boolean;
    itemCode: string;
  }[];
}[];

export default function MenuManagement() {
  const [menu, setMenu] = useState<MenuData>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadMenu() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pos/menu/items");

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to load menu");
      }

      const data = await res.json();

      // Ensure data is an array
      if (Array.isArray(data)) {
        setMenu(data);
      } else {
        console.error("API returned non-array data:", data);
        setMenu([]);
        setError("Invalid data format received");
      }
    } catch (err) {
      console.error("Error loading menu:", err);
      setError(err instanceof Error ? err.message : "Failed to load menu");
      setMenu([]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAvailability(itemId: string) {
    try {
      const res = await fetch(`/api/pos/menu/items/${itemId}/availability`, {
        method: "PATCH",
      });

      if (!res.ok) {
        throw new Error("Failed to toggle availability");
      }

      await loadMenu();
    } catch (err) {
      console.error("Error toggling availability:", err);
      alert("Failed to update item availability");
    }
  }

  useEffect(() => {
    loadMenu();
  }, []);

  if (loading) return <p>Loading menu...</p>;

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-red-500">Error: {error}</p>
        <button
          onClick={loadMenu}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex gap-3">
        <AddCategory onSuccess={loadMenu} />
        <AddMenuItem
          categories={menu.map((cat) => ({ id: cat.categoryId, name: cat.categoryName }))}
          onSuccess={loadMenu}
        />
      </div>

      {/* Menu categories and items */}
      {menu.length === 0 ? (
        <p className="text-muted-foreground">
          No categories yet. Add one to get started!
        </p>
      ) : (
        menu.map((category) => (
          <div key={category.categoryId} className="space-y-3">
            <h2 className="text-lg font-semibold">{category.categoryName}</h2>

            {category.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No items in this category
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="relative border rounded-lg p-3 flex flex-col items-center justify-between aspect-square hover:shadow-md transition-shadow"
                  >
                    {/* Availability toggle - top right */}
                    <div className="absolute top-1 right-1 scale-75">
                      <Switch
                        checked={item.isAvailable}
                        onCheckedChange={() => toggleAvailability(item.id)}
                      />
                    </div>

                    {/* Veg/Non-veg indicator - top left */}
                    <div className="absolute top-1 left-1 text-sm">
                      {item.isVeg ? "🟢" : "🔴"}
                    </div>

                    {/* Item content */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-1 mt-4">
                      <p className="font-bold text-md line-clamp-2">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.itemCode}
                      </p>
                    </div>

                    {/* Price at bottom */}
                    <div className="mt-1">
                      <p className="text-sm font-semibold">
                        ₹{(item.price / 100).toFixed(0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
