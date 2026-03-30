"use client";

import React, { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Email, Image as ImageIcon, CheckmarkOutline, Error } from "@carbon/icons-react";
import { motion } from "framer-motion";

export default function ProfileClient({ user }: { user: any }) {
  const [name, setName] = useState(user?.name || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleUpdate() {
    setIsUpdating(true);
    setStatus('idle');
    try {
      const { error } = await authClient.updateUser({
        name: name,
      });
      if (error) throw error;
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setIsUpdating(false);
    }
  }

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-[32px] p-8 backdrop-blur-sm shadow-2xl space-y-8">
        {/* Avatar Section */}
        <div className="flex items-center gap-6 pb-8 border-b border-neutral-800/50">
          <div className="relative group">
            <div className="size-24 rounded-[32px] bg-neutral-950 border border-neutral-800 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:border-neutral-600 shadow-2xl">
              {user.image ? (
                <img src={user.image} alt={user.name} className="size-full object-cover" />
              ) : (
                <User size={32} className="text-neutral-700" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                <ImageIcon size={20} className="text-white" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 size-8 rounded-xl bg-blue-500 border-4 border-[#0a0a0a] flex items-center justify-center text-white shadow-lg">
               <ImageIcon size={14} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-white">Profile Photo</h3>
            <p className="text-[13px] text-neutral-500 font-medium">Click to upload a new avatar. JPG, PNG or GIF.</p>
            <div className="flex gap-2 pt-2">
               <button className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-[11px] font-bold uppercase tracking-widest text-neutral-400 transition-all">Upload</button>
               <button className="px-3 py-1 bg-transparent hover:bg-red-500/10 rounded-lg text-[11px] font-bold uppercase tracking-widest text-red-400/60 transition-all">Remove</button>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1 flex items-center gap-2">
              <User size={14} /> Full Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-neutral-950 border-neutral-800 h-12 rounded-xl text-white focus:ring-1 focus:ring-white/20 transition-all"
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2 opacity-60">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1 flex items-center gap-2">
              <Email size={14} /> Email Address
            </Label>
            <Input
              value={user.email}
              disabled
              className="bg-neutral-950 border-neutral-800 h-12 rounded-xl text-neutral-400 cursor-not-allowed"
            />
            <p className="text-[10px] text-neutral-600 font-medium ml-1">Email cannot be changed currently.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-neutral-800/50">
          <div className="flex items-center gap-3">
             {status === 'success' && (
                <div className="flex items-center gap-2 text-green-400 text-[12px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-left-2 transition-all">
                   <CheckmarkOutline size={16} /> Saved Successfully
                </div>
             )}
             {status === 'error' && (
                <div className="flex items-center gap-2 text-red-400 text-[12px] font-bold uppercase tracking-widest">
                   <Error size={16} /> Update Failed
                </div>
             )}
          </div>
          <Button
            onClick={handleUpdate}
            disabled={isUpdating || name === user.name}
            className="px-8 h-12 bg-white hover:bg-neutral-200 text-black rounded-2xl font-bold uppercase tracking-[0.1em] transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:shadow-none"
          >
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="bg-blue-500/5 border border-blue-500/10 rounded-[32px] p-6 flex gap-4 items-center">
         <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <CheckmarkOutline size={24} />
         </div>
         <div>
            <h4 className="text-[13px] font-bold text-blue-400 uppercase tracking-widest mb-1">Account Verified</h4>
            <p className="text-[13px] text-neutral-500 font-medium leading-tight">
               Since {user.createdAt && mounted ? new Date(user.createdAt).toLocaleDateString() : "--/--/----"}. Your account is in good standing.
            </p>
         </div>
      </div>
    </motion.div>
  );
}
