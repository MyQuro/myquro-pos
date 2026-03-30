"use client";

import { useState } from "react";
import { submitSetupOrganization } from "../../app/setup/actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import UploadDocuments from "@/components/custom/upload-documents";

export default function SetupForm() {
  const [step, setStep] = useState(1); // 1 = Basic Info, 2 = Documents
  const [form, setForm] = useState({
    businessName: "",
    address: "",
    city: "",
    ownerName: "",
    phoneNumber: "",
    fssaiType: "BASIC",
    fssaiNumber: "",
    gstin: "",
  });
  const [documents, setDocuments] = useState<any[]>([]);

  const handleContinueToDocuments = (e: React.FormEvent) => {
    e.preventDefault();
    // Just move to next step, don't submit
    setStep(2);
  };

  async function handleFinalSubmit() {
    await submitSetupOrganization({
      businessName: form.businessName,
      address: form.address,
      city: form.city,
      ownerName: form.ownerName,
      phoneNumber: form.phoneNumber,
      fssaiType: form.fssaiType as "BASIC" | "STATE" | "CENTRAL",
      fssaiNumber: form.fssaiNumber,
      gstin: form.gstin || undefined,
      documents: documents,
    });
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen">
      <div className="max-w-2xl mx-auto py-20 px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
            Restaurant Setup
          </h1>
          <p className="text-neutral-500 font-medium">Complete your business profile to start using the POS.</p>
        </div>

        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all duration-300 ${
                step === 1
                  ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  : "bg-green-500/20 text-green-400 border border-green-500/30"
              }`}
            >
              {step === 1 ? "1" : "✓"}
            </div>
            <span className={`text-[11px] font-bold uppercase tracking-widest ${step === 1 ? "text-white" : "text-neutral-500"}`}>
              Basic Info
            </span>
          </div>
          
          <div className="flex-1 h-[2px] mx-6 bg-neutral-800">
            <div
              className={`h-full transition-all duration-500 ${
                step === 2 ? "bg-white w-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "bg-neutral-800 w-0"
              }`}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all duration-300 ${
                step === 2
                  ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  : "bg-neutral-900 text-neutral-600 border border-neutral-800"
              }`}
            >
              2
            </div>
            <span className={`text-[11px] font-bold uppercase tracking-widest ${step === 2 ? "text-white" : "text-neutral-600"}`}>
              Documents
            </span>
          </div>
        </div>

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <form onSubmit={handleContinueToDocuments} className="space-y-6 bg-neutral-900/40 border border-neutral-800/80 rounded-[32px] p-8 backdrop-blur-sm shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Business Name */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1">Restaurant / Business Name</Label>
              <Input
                value={form.businessName}
                onChange={(e) =>
                  setForm({ ...form, businessName: e.target.value })
                }
                required
                className="bg-neutral-950 border-neutral-800 h-12 rounded-xl text-white focus:ring-1 focus:ring-white/20 transition-all"
                placeholder="e.g. Blue Bistro"
              />
            </div>

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1">Business Address</Label>
              <Textarea
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
                required
                className="bg-neutral-950 border-neutral-800 min-h-[100px] rounded-xl text-white focus:ring-1 focus:ring-white/20 transition-all resize-none"
                placeholder="Full street address..."
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1">City</Label>
              <Input
                value={form.city}
                onChange={(e) =>
                  setForm({ ...form, city: e.target.value })
                }
                required
                className="bg-neutral-950 border-neutral-800 h-12 rounded-xl text-white focus:ring-1 focus:ring-white/20 transition-all"
                placeholder="e.g. Bhubaneswar"
              />
            </div>

            {/* Owner Name */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1">Owner / Contact Name</Label>
              <Input
                value={form.ownerName}
                onChange={(e) =>
                  setForm({ ...form, ownerName: e.target.value })
                }
                required
                className="bg-neutral-950 border-neutral-800 h-12 rounded-xl text-white focus:ring-1 focus:ring-white/20 transition-all"
                placeholder="Full Name"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1">Phone Number</Label>
              <Input
                value={form.phoneNumber}
                onChange={(e) =>
                  setForm({ ...form, phoneNumber: e.target.value })
                }
                required
                className="bg-neutral-950 border-neutral-800 h-12 rounded-xl text-white focus:ring-1 focus:ring-white/20 transition-all font-mono"
                placeholder="10-digit number"
              />
            </div>

            {/* FSSAI Type */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1">FSSAI License Type</Label>
              <Select
                value={form.fssaiType}
                onValueChange={(value) =>
                  setForm({ ...form, fssaiType: value })
                }
              >
                <SelectTrigger className="bg-neutral-950 border-neutral-800 h-12 rounded-xl text-white focus:ring-1 focus:ring-white/20 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                  <SelectItem value="BASIC">Basic</SelectItem>
                  <SelectItem value="STATE">State</SelectItem>
                  <SelectItem value="CENTRAL">Central</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* FSSAI Number */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1">FSSAI License Number</Label>
              <Input
                value={form.fssaiNumber}
                onChange={(e) =>
                  setForm({ ...form, fssaiNumber: e.target.value })
                }
                required
                className="bg-neutral-950 border-neutral-800 h-12 rounded-xl text-white focus:ring-1 focus:ring-white/20 transition-all font-mono"
                placeholder="14-digit number"
              />
            </div>

            {/* GSTIN */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1">GSTIN (optional)</Label>
              <Input
                value={form.gstin}
                onChange={(e) =>
                  setForm({ ...form, gstin: e.target.value })
                }
                className="bg-neutral-950 border-neutral-800 h-12 rounded-xl text-white focus:ring-1 focus:ring-white/20 transition-all font-mono"
                placeholder="GST Number"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-8">
            <Button type="submit" className="flex-1 bg-white hover:bg-neutral-200 text-black h-12 rounded-2xl font-bold uppercase tracking-[0.1em] transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.15)]">
              Continue to Documents
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: Upload Documents */}
      {step === 2 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <UploadDocuments onUploadComplete={(doc) => setDocuments(prev => [...prev, doc])} />
          
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1 h-12 bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={handleFinalSubmit}
              className="flex-1 h-12 bg-white hover:bg-neutral-200 text-black rounded-2xl font-bold uppercase tracking-[0.1em] transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.15)]"
            >
              Submit for Verification
            </Button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
