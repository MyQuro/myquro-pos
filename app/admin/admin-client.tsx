"use client";

import React, { useState } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import {
  Building,
  CheckmarkOutline,
  Time,
  List,
  UserAvatar,
  Filter
} from "@carbon/icons-react";
import { cn } from "@/lib/utils";
import PendingOrgTable, { PendingOrg } from "@/components/custom/pending-org-table";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
};

export function AdminDashboardClient({ 
  stats,
  pendingOrgs,
  activeOrgs,
  adminName
}: { 
  stats: { total: number; active: number; pending: number };
  pendingOrgs: PendingOrg[];
  activeOrgs: PendingOrg[];
  adminName: string;
}) {
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');

  return (
    <div className="bg-[#0a0a0a] min-h-screen">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-10 max-w-7xl mx-auto px-6 py-10 pb-32"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-semibold text-4xl tracking-tight text-neutral-50 mb-2">
              System Administration
            </h1>
            <p className="text-neutral-500 font-medium tracking-wide">
              Manage organization requests and platform health.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-[11px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
               <div className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
               {adminName} Active
             </div>
          </div>
        </motion.div>

        {/* Metrics Section */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
             title="Total Organizations" 
             value={stats.total} 
             label="System-wide" 
             icon={<Building size={24} />} 
             trend="Global"
             accent="blue"
          />
          <MetricCard 
             title="Active Partners" 
             value={stats.active} 
             label="Verified Orgs" 
             icon={<CheckmarkOutline size={24} />} 
             trend="Operational"
             accent="green"
          />
          <MetricCard 
             title="Pending Reviews" 
             value={stats.pending} 
             label="Awaiting Action" 
             icon={<Time size={24} />} 
             trend="Priority"
             accent="orange"
             isDark
          />
        </motion.div>

        {/* Organizations Section */}
        <motion.div variants={itemVariants} className="space-y-6">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
              <div className="flex items-center gap-3">
                 <div className="bg-neutral-900 size-10 rounded-xl border border-neutral-800 flex items-center justify-center text-neutral-400">
                    <List size={20} />
                 </div>
                 <h2 className="font-semibold text-lg text-neutral-50 tracking-tight">Partners Directory</h2>
              </div>
              
              {/* Tabs */}
              <div className="bg-neutral-900/80 border border-neutral-800 p-1 rounded-2xl flex items-center gap-1 backdrop-blur-sm">
                 <TabButton 
                    active={activeTab === 'pending'} 
                    onClick={() => setActiveTab('pending')}
                    label="Pending Requests"
                    count={pendingOrgs.length}
                    icon={<Time size={16} />}
                 />
                 <TabButton 
                    active={activeTab === 'active'} 
                    onClick={() => setActiveTab('active')}
                    label="Active Partners"
                    count={activeOrgs.length}
                    icon={<CheckmarkOutline size={16} />}
                 />
              </div>
           </div>

           <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-[32px] overflow-hidden backdrop-blur-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <PendingOrgTable 
                    organizations={activeTab === 'pending' ? pendingOrgs : activeOrgs} 
                  />
                </motion.div>
              </AnimatePresence>
           </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function TabButton({ 
  active, 
  onClick, 
  label, 
  count, 
  icon 
}: { 
  active: boolean; 
  onClick: () => void; 
  label: string; 
  count: number;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2.5 transition-all duration-300",
        active 
          ? "bg-neutral-50 text-black shadow-lg" 
          : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50"
      )}
    >
      <span className={cn("transition-colors", active ? "text-black" : "text-neutral-600")}>
        {icon}
      </span>
      {label}
      <span className={cn(
        "px-1.5 py-0.5 rounded-md text-[9px] font-bold",
        active ? "bg-black/10 text-black" : "bg-neutral-800 text-neutral-500"
      )}>
        {count}
      </span>
    </button>
  );
}

function MetricCard({ 
  title, 
  value, 
  label, 
  icon, 
  trend, 
  accent, 
  isDark 
}: { 
  title: string; 
  value: string | number; 
  label: string; 
  icon: React.ReactNode; 
  trend: string; 
  accent: 'blue' | 'orange' | 'green';
  isDark?: boolean;
}) {
  return (
    <div className={cn(
      "relative overflow-hidden p-8 border rounded-[32px] flex flex-col justify-between h-56 transition-all duration-300",
      isDark 
        ? "bg-neutral-50 border-white shadow-[0_20px_40px_rgba(0,0,0,0.5)] text-black" 
        : "bg-neutral-900/50 border-neutral-800 text-white hover:border-neutral-700 hover:bg-neutral-900/80 shadow-2xl"
    )}>
      <div className="flex justify-between items-start relative z-10">
        <div className={cn(
          "size-12 rounded-2xl flex items-center justify-center border transition-colors shadow-lg",
          isDark 
            ? "bg-black/5 border-black/10 text-black" 
            : "bg-neutral-950 border-neutral-800 text-neutral-400"
        )}>
          {icon}
        </div>
        <div className={cn(
          "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border",
          isDark 
            ? "bg-black/10 border-black/5 text-black" 
            : accent === 'blue' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
              accent === 'orange' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
              "bg-green-500/10 text-green-400 border-green-500/20"
        )}>
           {trend}
        </div>
      </div>
      <div className="relative z-10">
         <p className={cn(
           "text-[10px] font-bold uppercase tracking-[0.2em] mb-2",
           isDark ? "text-neutral-600" : "text-neutral-500"
         )}>
           {title}
         </p>
         <div className="flex items-baseline gap-2">
            <h2 className="font-bold text-5xl tracking-tighter tabular-nums leading-none mb-1">{value}</h2>
            <span className={cn(
              "text-[11px] font-bold uppercase tracking-widest",
              isDark ? "text-neutral-500" : "text-neutral-600"
            )}>{label}</span>
         </div>
      </div>

      {!isDark && (
         <div className="absolute -bottom-10 -right-10 size-40 bg-neutral-500/5 blur-3xl rounded-full" />
      )}
    </div>
  );
}
