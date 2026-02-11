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
    });
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 pb-10">
      <h1 className="text-2xl font-semibold mb-6">
        Restaurant Setup
      </h1>

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
              step === 1
                ? "bg-blue-600 text-white"
                : "bg-green-600 text-white"
            }`}
          >
            {step === 1 ? "1" : "✓"}
          </div>
          <span className={`text-sm font-medium ${step === 1 ? "text-gray-900" : "text-gray-500"}`}>
            Basic Information
          </span>
        </div>
        
        <div className="flex-1 h-1 mx-4 bg-gray-200">
          <div
            className={`h-full transition-all ${
              step === 2 ? "bg-blue-600 w-full" : "bg-gray-200 w-0"
            }`}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
              step === 2
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            2
          </div>
          <span className={`text-sm font-medium ${step === 2 ? "text-gray-900" : "text-gray-500"}`}>
            Upload Documents
          </span>
        </div>
      </div>

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <form onSubmit={handleContinueToDocuments} className="space-y-4">
          {/* Business Name */}
          <div className="space-y-1">
            <Label>Restaurant / Business Name</Label>
            <Input
              value={form.businessName}
              onChange={(e) =>
                setForm({ ...form, businessName: e.target.value })
              }
              required
            />
          </div>

          {/* Address */}
          <div className="space-y-1">
            <Label>Business Address</Label>
            <Textarea
              value={form.address}
              onChange={(e) =>
                setForm({ ...form, address: e.target.value })
              }
              required
            />
          </div>

          {/* City */}
          <div className="space-y-1">
            <Label>City</Label>
            <Input
              value={form.city}
              onChange={(e) =>
                setForm({ ...form, city: e.target.value })
              }
              required
            />
          </div>

          {/* Owner Name */}
          <div className="space-y-1">
            <Label>Owner / Contact Name</Label>
            <Input
              value={form.ownerName}
              onChange={(e) =>
                setForm({ ...form, ownerName: e.target.value })
              }
              required
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <Label>Phone Number</Label>
            <Input
              value={form.phoneNumber}
              onChange={(e) =>
                setForm({ ...form, phoneNumber: e.target.value })
              }
              required
            />
          </div>

          {/* FSSAI Type */}
          <div className="space-y-1">
            <Label>FSSAI License Type</Label>
            <Select
              value={form.fssaiType}
              onValueChange={(value) =>
                setForm({ ...form, fssaiType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BASIC">Basic</SelectItem>
                <SelectItem value="STATE">State</SelectItem>
                <SelectItem value="CENTRAL">Central</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* FSSAI Number */}
          <div className="space-y-1">
            <Label>FSSAI License Number</Label>
            <Input
              value={form.fssaiNumber}
              onChange={(e) =>
                setForm({ ...form, fssaiNumber: e.target.value })
              }
              required
            />
          </div>

          {/* GSTIN */}
          <div className="space-y-1">
            <Label>GSTIN (optional)</Label>
            <Input
              value={form.gstin}
              onChange={(e) =>
                setForm({ ...form, gstin: e.target.value })
              }
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Continue to Documents
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: Upload Documents */}
      {step === 2 && (
        <div className="space-y-6">
          <UploadDocuments />
          
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={handleFinalSubmit}
              className="flex-1"
            >
              Submit for Verification
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
