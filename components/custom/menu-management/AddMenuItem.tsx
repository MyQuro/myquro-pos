"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Add, ShoppingBag } from "@carbon/icons-react";
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

type MenuItem = {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  itemCode: string;
};

export default function AddMenuItem({
  categories,
  onSuccess,
  onOptimisticAdd,
}: {
  categories: Category[];
  onSuccess: () => void;
  onOptimisticAdd?: (item: MenuItem, categoryId: string) => void;
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

    const tempId = `temp-${Date.now()}`;
    const newItem: MenuItem = {
      id: tempId,
      name,
      price: Number(price) * 100,
      isVeg,
      isAvailable: true,
      itemCode,
    };

    if (onOptimisticAdd) {
      onOptimisticAdd(newItem, categoryId);
    }

    setOpen(false);
    const formData = { name, price, itemCode, categoryId, isVeg };
    setName("");
    setPrice("");
    setItemCode("");
    setCategoryId(undefined);
    setIsVeg(true);

    setLoading(true);
    try {
      const res = await fetch("/api/pos/menu/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          price: Number(formData.price) * 100,
          categoryId: formData.categoryId,
          isVeg: formData.isVeg,
          itemCode: formData.itemCode,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        onSuccess();
      }
    } catch (err) {
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-neutral-50 text-black hover:bg-white rounded-xl gap-2 font-semibold shadow-lg shadow-neutral-900/50">
          <Add size={20} />
          <span>Add Menu Item</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0a0a0a] border-neutral-800 text-neutral-50 p-8 rounded-3xl sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
              <ShoppingBag size={20} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-semibold tracking-tight">Add Menu Item</DialogTitle>
              <p className="text-neutral-500 text-sm">Fill in the details for the new food item.</p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-8">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="item-name" className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Item Name</Label>
            <Input
              id="item-name"
              placeholder="e.g. Signature Dosa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-neutral-900 border-neutral-800 focus:border-neutral-700 h-12 rounded-xl px-4 transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-code" className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Item Code</Label>
            <Input
              id="item-code"
              placeholder="e.g. F001"
              value={itemCode}
              onChange={(e) => setItemCode(e.target.value)}
              className="bg-neutral-900 border-neutral-800 focus:border-neutral-700 h-12 rounded-xl px-4 transition-all font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Price (₹)</Label>
            <Input
              id="price"
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="bg-neutral-900 border-neutral-800 focus:border-neutral-700 h-12 rounded-xl px-4 transition-all tabular-nums"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category" className="bg-neutral-900 border-neutral-800 h-12 rounded-xl">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-50">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="focus:bg-neutral-800 focus:text-white">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Veg / Non-Veg</Label>
            <Select
              value={isVeg ? "VEG" : "NON_VEG"}
              onValueChange={(v) => setIsVeg(v === "VEG")}
            >
              <SelectTrigger id="type" className="bg-neutral-900 border-neutral-800 h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-50">
                <SelectItem value="VEG" className="focus:bg-neutral-800 focus:text-white">🟢 Vegetarian</SelectItem>
                <SelectItem value="NON_VEG" className="focus:bg-neutral-800 focus:text-white">🔴 Non-Vegetarian</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-8 border-t border-neutral-900 mt-6">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            className="bg-transparent border-neutral-800 hover:bg-neutral-900 rounded-xl px-6 h-11"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !name || !price || !categoryId || !itemCode}
            className="bg-neutral-50 text-black hover:bg-white rounded-xl px-10 h-11 font-semibold"
          >
            {loading ? "Saving..." : "Save Item"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
