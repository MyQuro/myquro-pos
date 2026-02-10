"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = {
  id: string;
  name: string;
};

export default function AddMenuItem({
  categories,
  onSuccess,
}: {
  categories: Category[];
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [categoryId, setCategoryId] = useState<string>();
  const [isVeg, setIsVeg] = useState(true);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit() {
    if (!name || !price || !categoryId || !itemCode) return;

    setLoading(true);
    const res = await fetch("/api/pos/menu/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        price: Number(price) * 100,
        categoryId,
        isVeg,
        itemCode,
      }),
    });

    if (res.ok) {
      setName("");
      setPrice("");
      setItemCode("");
      setCategoryId(undefined);
      setIsVeg(true);
      setOpen(false);
      onSuccess();
    } else {
      const error = await res.json();
      alert(error.error || "Failed to add item");
    }
    
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Menu Item</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Menu Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          

          <div className="space-y-2">
            <Label htmlFor="item-name">Item Name</Label>
            <Input
              id="item-name"
              placeholder="e.g., Masala Dosa"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-code">Item Code</Label>
            <Input
              id="item-code"
              placeholder="e.g., MD001"
              value={itemCode}
              onChange={(e) => setItemCode(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (₹)</Label>
            <Input
              id="price"
              type="number"
              placeholder="e.g., 120"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={isVeg ? "VEG" : "NON_VEG"}
              onValueChange={(v) => setIsVeg(v === "VEG")}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VEG">🟢 Veg</SelectItem>
                <SelectItem value="NON_VEG">🔴 Non-Veg</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !name || !price || !categoryId || !itemCode}
            >
              {loading ? "Adding..." : "Add Item"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
