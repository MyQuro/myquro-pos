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

export default function SetupForm() {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

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
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-lg font-semibold mb-6">
        Restaurant Setup
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <Button type="submit" className="w-full">
          Submit for Verification
        </Button>
      </form>
    </div>
  );
}
