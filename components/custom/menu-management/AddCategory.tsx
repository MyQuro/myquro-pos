"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Add, Close } from "@carbon/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AddCategory({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) return;

    setLoading(true);
    await fetch("/api/pos/menu/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setName("");
    setLoading(false);
    setOpen(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800 hover:text-white rounded-xl gap-2 font-medium">
          <Add size={20} />
          <span>Add Category</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0a0a0a] border-neutral-800 text-neutral-50 p-8 rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold tracking-tight">New Category</DialogTitle>
          <p className="text-neutral-500 text-sm mt-1">Organize your menu items into logical groups.</p>
        </DialogHeader>
        
        <div className="space-y-6 mt-8">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Category Name</p>
            <Input
              placeholder="e.g. Beverages, Main Course..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="bg-neutral-900 border-neutral-800 focus:border-neutral-700 h-12 rounded-xl px-4 text-base transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="bg-transparent border-neutral-800 hover:bg-neutral-900 rounded-xl px-6 h-11"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !name.trim()}
              className="bg-neutral-50 text-black hover:bg-white rounded-xl px-8 h-11 font-semibold"
            >
              {loading ? "Saving..." : "Save Category"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
