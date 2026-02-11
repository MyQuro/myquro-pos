  "use client";

  import { useEffect, useState, useCallback, useTransition } from "react";
  import { Input } from "@/components/ui/input";
  import { Button } from "@/components/ui/button";

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
      <div className="flex-1 flex flex-col bg-background">
        {/* Header with Search */}
        <div className="p-4 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <h2 className="text-sm font-semibold">Menu Items</h2>
            {!activeOrderId && (
              <span className="text-xs text-muted-foreground ml-auto">
                Select an order first
              </span>
            )}
          </div>
          <div className="relative">
            <Input
              placeholder="Search by item code..."
              value={searchCode}
              onChange={(e) => {
                setSearchCode(e.target.value);
                searchByCode(e.target.value);
              }}
              disabled={!activeOrderId}
              className="pr-8"
            />
            {searchCode && (
              <button
              title="button"
                onClick={() => {
                  setSearchCode("");
                  fetchItems();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m15 9-6 6" />
                  <path d="m9 9 6 6" />
                </svg>
              </button>
            )}
          </div>
          {isPending && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <svg
                className="animate-spin h-3 w-3"
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
              Searching...
            </p>
          )}
          {searchCode && items.length > 0 && !isPending && (
            <p className="text-xs text-muted-foreground mt-2">
              Found {items.length} item{items.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {!activeOrderId && (
            <EmptyState
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground/50"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              }
              title="No Order Selected"
              message="Select or create an order to start adding items"
            />
          )}

          {activeOrderId && loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <svg
                className="animate-spin h-10 w-10 text-primary mb-3"
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
              <p className="text-sm text-muted-foreground">Loading menu...</p>
            </div>
          )}

          {activeOrderId && !loading && items.length === 0 && (
            <EmptyState
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground/50"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              }
              title="No Items Found"
              message={
                searchCode
                  ? `No items match "${searchCode}"`
                  : "No menu items available"
              }
            />
          )}

          {activeOrderId && !loading && items.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {items.map((item, index) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAdd={() => addItem(item.id)}
                  isAdding={addingItems.has(item.id)}
                  index={index}
                />
              ))}
            </div>
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
    // Safely handle price - default to 0 if invalid
    const price = typeof item.price === "number" && !isNaN(item.price) ? item.price : 0;
    const rupees = Math.floor(price / 100);
    const paise = price % 100;

    return (
      <div
        className="group relative border rounded-lg p-3 flex flex-col gap-2 bg-card hover:shadow-lg hover:border-primary/50 transition-all duration-200 hover:-translate-y-1"
        style={{
          animation: "fadeInUp 0.3s ease-out",
          animationDelay: `${index * 0.03}s`,
          animationFillMode: "backwards",
        }}
      >
        {/* Veg indicator */}
        {item.isVeg && (
          <div className="absolute top-2 right-2">
            <div className="bg-green-100 dark:bg-green-900/30 border border-green-600 rounded p-0.5">
              <div className="w-2 h-2 rounded-full bg-green-600"></div>
            </div>
          </div>
        )}

        <div className="flex-1">
          <h3 className="font-medium text-sm leading-tight line-clamp-2 pr-6 group-hover:text-primary transition-colors">
            {item.name || "Unnamed Item"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {item.itemCode || "N/A"}
          </p>
        </div>

        <div className="flex items-end justify-between gap-2 pt-2 border-t">
          <span className="text-lg font-bold text-primary">
            ₹{rupees}
            <span className="text-xs text-muted-foreground font-normal">
              .{paise.toString().padStart(2, "0")}
            </span>
          </span>

          <Button
            size="sm"
            onClick={onAdd}
            disabled={isAdding}
            className="relative shrink-0 h-8 px-3"
          >
            {isAdding ? (
              <>
                <svg
                  className="animate-spin h-3.5 w-3.5 absolute left-1/2 -translate-x-1/2"
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
                <span className="opacity-0">Add</span>
              </>
            ) : (
              <span className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
                Add
              </span>
            )}
          </Button>
        </div>
      </div>
    );
  }

  function EmptyState({
    icon,
    title,
    message,
  }: {
    icon: React.ReactNode;
    title: string;
    message: string;
  }) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-xs space-y-3">
          <div className="flex justify-center">{icon}</div>
          <div className="space-y-1">
            <h3 className="font-medium text-sm">{title}</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  <style jsx>{`
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `}</style>
