"use client";

import React, { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Security, 
  Password, 
  TwoFactorAuthentication, 
  Devices, 
  Time, 
  Logout,
  Information,
  CheckmarkOutline,
  Error
} from "@carbon/icons-react";
import { motion } from "framer-motion";

export default function SecurityClient({ session }: { session: any }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handlePasswordChange() {
    setIsUpdating(true);
    setStatus('idle');
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (error) throw error;
      setStatus('success');
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Password Change Card */}
      <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-[32px] p-8 backdrop-blur-sm shadow-2xl space-y-8">
        <div className="flex items-center gap-4 pb-6 border-b border-neutral-800/50">
           <div className="size-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400">
              <Password size={24} />
           </div>
           <div>
              <h3 className="font-bold text-lg text-white">Change Password</h3>
              <p className="text-[13px] text-neutral-500 font-medium">Reset your account password to maintain high security.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1">Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-neutral-950 border-neutral-800 h-12 rounded-xl text-white focus:ring-1 focus:ring-white/20 transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1">New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-neutral-950 border-neutral-800 h-12 rounded-xl text-white focus:ring-1 focus:ring-white/20 transition-all font-mono"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-neutral-800/50">
          <div className="flex items-center gap-3">
             {status === 'success' && (
                <div className="flex items-center gap-2 text-green-400 text-[12px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-left-2">
                   <CheckmarkOutline size={16} /> Password Updated
                </div>
             )}
             {status === 'error' && (
                <div className="flex items-center gap-2 text-red-400 text-[12px] font-bold uppercase tracking-widest">
                   <Error size={16} /> Update Failed
                </div>
             )}
          </div>
          <Button
            onClick={handlePasswordChange}
            disabled={isUpdating || !currentPassword || !newPassword}
            className="px-8 h-12 bg-white hover:bg-neutral-200 text-black rounded-2xl font-bold uppercase tracking-[0.1em] transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.15)] disabled:opacity-50"
          >
            {isUpdating ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </div>

      {/* Active Sessions Card */}
      <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-[32px] p-8 backdrop-blur-sm shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                 <Devices size={24} />
              </div>
              <div>
                 <h3 className="font-bold text-lg text-white">Active Sessions</h3>
                 <p className="text-[13px] text-neutral-500 font-medium">Currently logged in devices and sessions.</p>
              </div>
           </div>
           <Button variant="outline" className="border-neutral-800 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white rounded-xl">
              Revoke All
           </Button>
        </div>

        <div className="space-y-3">
           <div className="flex items-center justify-between p-5 bg-neutral-950/60 border border-neutral-800/50 rounded-2xl group hover:border-neutral-700 transition-all">
              <div className="flex items-center gap-4">
                 <div className="size-10 rounded-xl bg-neutral-900 flex items-center justify-center text-neutral-400">
                    <Devices size={20} />
                 </div>
                 <div>
                    <div className="flex items-center gap-2">
                       <p className="font-bold text-sm text-neutral-100">Chrome on macOS</p>
                       <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-bold uppercase tracking-widest rounded-md border border-blue-500/20">Current</span>
                    </div>
                    <p className="text-[11px] text-neutral-600 font-medium uppercase tracking-widest mt-0.5">Bhubaneswar, India • {mounted ? new Date().toLocaleDateString() : "--/--/----"}</p>
                 </div>
              </div>
              <button disabled className="text-neutral-700 hover:text-neutral-500 transition-colors opacity-50 cursor-not-allowed">
                 <Logout size={20} />
              </button>
           </div>
        </div>
      </div>

      {/* 2FA Card (Coming Soon) */}
      <div className="p-6 bg-neutral-900/20 border border-dashed border-neutral-800 rounded-[32px] flex flex-col items-center justify-center py-10 opacity-60">
         <div className="size-14 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-700 mb-4">
            <TwoFactorAuthentication size={32} />
         </div>
         <h4 className="text-[14px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Two-Factor Authentication</h4>
         <p className="text-[12px] text-neutral-600 font-medium">Secure your account with 2FA. (Coming Soon)</p>
      </div>
    </motion.div>
  );
}
