"use client";

import { useState, useEffect } from "react";
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
import { Plus, Trash2, Save, ShoppingCart } from "lucide-react";

type Vendor = { id: string, name: string };
type MenuItem = { id: string, name: string };

type PurchaseItemInput = {
  menuItemId: string;
  quantity: string;
  unitCost: string;
};

export default function PurchaseEntry({ 
  open, 
  onOpenChange, 
  onSuccess 
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  onSuccess?: () => void
}) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Form
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseItemInput[]>([
    { menuItemId: "", quantity: "1", unitCost: "0" }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  async function fetchData() {
    setLoading(true);
    try {
      const [vRes, mRes] = await Promise.all([
        fetch("/api/pos/vendors"),
        fetch("/api/pos/menu/items")
      ]);
      if (vRes.ok) setVendors(await vRes.json());
      if (mRes.ok) {
        const data = await mRes.json();
        const flat: MenuItem[] = [];
        data.forEach((c: any) => c.items.forEach((i: any) => flat.push(i)));
        setMenuItems(flat);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const addItem = () => setItems([...items, { menuItemId: "", quantity: "1", unitCost: "0" }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: keyof PurchaseItemInput, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const total = items.reduce((acc, item) => {
    return acc + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0);
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVendorId || items.some(i => !i.menuItemId)) {
      alert("Please select vendor and all items");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/pos/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: selectedVendorId,
          referenceNumber,
          notes,
          items: items.map(i => ({
            menuItemId: i.menuItemId,
            quantity: parseInt(i.quantity),
            unitCost: Math.round(parseFloat(i.unitCost) * 100) // to paise
          }))
        })
      });

      if (res.ok) {
        onSuccess?.();
        onOpenChange(false);
        // Reset
        setSelectedVendorId("");
        setReferenceNumber("");
        setNotes("");
        setItems([{ menuItemId: "", quantity: "1", unitCost: "0" }]);
      } else {
        alert("Failed to save purchase");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving purchase");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            Record New Purchase
          </DialogTitle>
          <DialogDescription>
            Enter bill details and update inventory stock.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vendor *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                required
              >
                <option value="" disabled>Select Vendor...</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Reference No (Invoice #)</Label>
              <Input 
                placeholder="e.g. INV-1023" 
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Purchase Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Item Name</th>
                    <th className="px-4 py-2 text-left w-24">Qty</th>
                    <th className="px-4 py-2 text-left w-32">Unit Cost (₹)</th>
                    <th className="px-4 py-2 text-right w-32">Total</th>
                    <th className="px-4 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <select
                          className="w-full h-9 rounded-md border bg-transparent px-2 text-sm"
                          value={item.menuItemId}
                          onChange={(e) => updateItem(idx, "menuItemId", e.target.value)}
                          required
                        >
                          <option value="" disabled>Select Item...</option>
                          {menuItems.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" 
                          min="1" 
                          className="h-9"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" 
                          step="0.01" 
                          className="h-9"
                          value={item.unitCost}
                          onChange={(e) => updateItem(idx, "unitCost", e.target.value)}
                        />
                      </td>
                      <td className="p-2 text-right font-medium">
                        ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0)).toFixed(2)}
                      </td>
                      <td className="p-2">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500"
                          onClick={() => removeItem(idx)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input 
              placeholder="Any additional info..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-lg font-bold text-blue-700">
              Grand Total: ₹{total.toFixed(2)}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Saving..." : "Record Purchase"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
