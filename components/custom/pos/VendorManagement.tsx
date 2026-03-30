"use client";

import { useEffect, useState } from "react";
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
import { 
  Enterprise, 
  PhoneVoice, 
  Email, 
  Map, 
  Purchase, 
  Add,
  UserAvatar,
  ChevronRight,
  Identification
} from "@carbon/icons-react";
import PurchaseEntry from "./PurchaseEntry";
import { motion } from "framer-motion";

type Vendor = {
  id: string;
  name: string;
  contactInfo: string | null;
};

const softSpringEasing = [0.25, 1.1, 0.4, 1] as [number, number, number, number];

export default function VendorManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {
    setLoading(true);
    try {
      const res = await fetch("/api/pos/vendors");
      if (res.ok) {
        const data = await res.json();
        setVendors(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddVendor(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/pos/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contactName, phone, email, address }),
      });

      if (res.ok) {
        const newVendor = await res.json();
        setVendors((prev) => [newVendor, ...prev]);
        setIsModalOpen(false);
        setName("");
        setContactName("");
        setPhone("");
        setEmail("");
        setAddress("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto dark">
      {/* Header Area */}
      <div className="flex justify-between items-end border-b border-neutral-800 pb-6">
        <div>
          <h2 className="text-3xl font-semibold text-neutral-50 tracking-tight">Vendors</h2>
          <p className="text-neutral-400 text-sm mt-1">Directory of {vendors.length} active suppliers and partners.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsPurchaseModalOpen(true)}
            className="border-neutral-800 text-neutral-300 hover:bg-neutral-900 rounded-xl px-5 h-11 flex gap-2 font-medium transition-all active:scale-95"
          >
            <Purchase size={20} />
            New Purchase
          </Button>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-neutral-50 text-black hover:bg-neutral-200 rounded-xl px-6 h-11 flex gap-2 font-medium transition-all active:scale-95"
          >
            <Add size={20} />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-neutral-500 gap-3">
            <div className="animate-spin size-6 border-2 border-neutral-700 border-t-neutral-400 rounded-full" />
            <p className="text-sm font-light">Retrieving contact directory...</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-neutral-800 rounded-3xl text-neutral-500">
            <Enterprise size={48} className="mx-auto mb-4 opacity-20" />
            <p>Your supplier network is currently empty.</p>
          </div>
        ) : (
          vendors.map((v, idx) => {
            let info = { contactName: "", phone: "", email: "", address: "" };
            if (v.contactInfo) {
              try { info = JSON.parse(v.contactInfo); } catch (e) {}
            }
            return (
              <motion.div 
                key={v.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ease: softSpringEasing, duration: 0.5, delay: idx * 0.05 }}
                className="group relative bg-[#0a0a0a] border border-neutral-800 hover:border-neutral-700 p-6 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1"
              >
                <div className="size-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 mb-4 group-hover:text-neutral-50 transition-colors">
                  <Enterprise size={24} />
                </div>
                
                <h3 className="text-xl font-semibold text-neutral-50 mb-1 tracking-tight">{v.name}</h3>
                {info.contactName && (
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-6 uppercase tracking-wider font-medium">
                    <UserAvatar size={14} />
                    {info.contactName}
                  </div>
                )}
                
                <div className="space-y-4 pt-4 border-t border-neutral-800/50">
                  {info.phone && (
                    <div className="flex items-center gap-3 text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">
                      <PhoneVoice size={16} className="text-neutral-600" />
                      <span>{info.phone}</span>
                    </div>
                  )}
                  {info.email && (
                    <div className="flex items-center gap-3 text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">
                      <Email size={16} className="text-neutral-600" />
                      <span className="truncate">{info.email}</span>
                    </div>
                  )}
                  {info.address && (
                    <div className="flex items-center gap-3 text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">
                      <Map size={16} className="text-neutral-600" />
                      <span className="truncate" title={info.address}>{info.address}</span>
                    </div>
                  )}
                </div>

                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="size-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#0a0a0a] border-neutral-800 text-neutral-50 rounded-2xl max-w-lg">
          <DialogHeader className="border-b border-neutral-800 pb-4">
            <DialogTitle className="text-2xl font-semibold tracking-tight">New Partner</DialogTitle>
            <DialogDescription className="text-neutral-400">Initialize a new vendor relationship.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddVendor} className="space-y-6 py-8">
            <div className="space-y-2">
              <Label className="text-neutral-400 text-xs uppercase tracking-widest font-bold">Company Identity</Label>
              <div className="relative">
                <Enterprise className="absolute left-3 top-3 text-neutral-500" size={18} />
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Enter Legal Entity Name"
                  required 
                  className="bg-neutral-900 border-neutral-800 pl-10 h-12 rounded-xl focus:border-neutral-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-neutral-400 text-xs uppercase tracking-widest font-bold">Contact Person</Label>
                <div className="relative">
                  <Identification className="absolute left-3 top-3 text-neutral-500" size={18} />
                  <Input value={contactName} onChange={(e) => setContactName(e.target.value)} className="bg-neutral-900 border-neutral-800 pl-10 h-12 rounded-xl focus:border-neutral-500 transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-400 text-xs uppercase tracking-widest font-bold">Phone Number</Label>
                <div className="relative">
                  <PhoneVoice className="absolute left-3 top-3 text-neutral-500" size={18} />
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-neutral-900 border-neutral-800 pl-10 h-12 rounded-xl focus:border-neutral-500 transition-all" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-neutral-400 text-xs uppercase tracking-widest font-bold">Email Reach</Label>
              <div className="relative">
                <Email className="absolute left-3 top-3 text-neutral-500" size={18} />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-neutral-900 border-neutral-800 pl-10 h-12 rounded-xl focus:border-neutral-500 transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-neutral-400 text-xs uppercase tracking-widest font-bold">Physical Address</Label>
              <div className="relative">
                <Map className="absolute left-3 top-3 text-neutral-500" size={18} />
                <Input value={address} onChange={(e) => setAddress(e.target.value)} className="bg-neutral-900 border-neutral-800 pl-10 h-12 rounded-xl focus:border-neutral-500 transition-all" />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 border-neutral-800 text-neutral-400 h-12 rounded-xl hover:bg-neutral-900 active:scale-95 transition-all">
                Discard
              </Button>
              <Button type="submit" disabled={isSubmitting || !name} className="flex-1 bg-neutral-50 text-black font-semibold h-12 rounded-xl hover:bg-neutral-200 active:scale-95 transition-all">
                {isSubmitting ? "Finalizing..." : "Initialize Relation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <PurchaseEntry 
        open={isPurchaseModalOpen} 
        onOpenChange={setIsPurchaseModalOpen}
        onSuccess={() => {}}
      />
    </div>
  );
}
