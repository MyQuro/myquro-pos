"use client";

import React from 'react';
import Link from 'next/link';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import {
  DocumentAdd,
  Task,
  Report,
  UserMultiple,
  Folder,
  Group,
  CheckmarkOutline,
  Time,
  Analytics,
  ArrowUpRight,
  Activity,
  ChartBar,
  Receipt
} from "@carbon/icons-react";
import { cn } from "@/lib/utils";

const softSpringEasing: [number, number, number, number] = [0.25, 1.1, 0.4, 1];

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

const quickActions = [
  { href: "/pos/orders", icon: <DocumentAdd size={24} />, title: "POS Terminal", desc: "Manage active orders", accent: "blue" },
  { href: "/pos/menu", icon: <Task size={24} />, title: "Menu Catalog", desc: "Items & Categories", accent: "orange" },
  { href: "/pos/reports", icon: <Report size={24} />, title: "Reports", desc: "View sales analytics", accent: "green" },
  { href: "/pos/customers", icon: <UserMultiple size={24} />, title: "Customers", desc: "Loyalty & contacts", accent: "blue" },
  { href: "/pos/inventory", icon: <Folder size={24} />, title: "Inventory", desc: "Manage stock levels", accent: "orange" },
  { href: "/pos/vendors", icon: <Group size={24} />, title: "Vendors", desc: "Manage suppliers", accent: "green" },
];

export function DashboardClient({ 
  userName,
  openOrdersCount,
  completedOrdersCount,
  formattedRevenue,
  recentActivity,
  topItems
}: { 
  userName?: string;
  openOrdersCount: number;
  completedOrdersCount: number;
  formattedRevenue: string;
  recentActivity: { id: string; type: string; amount: string; time: string; status: string }[];
  topItems: { name: string; sales: number; max: number }[];
}) {
  const greetingName = userName ? userName.split(' ')[0] : 'Operator';
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10 max-w-7xl mx-auto px-6 py-8 pb-32 bg-[#0a0a0a] min-screen"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-semibold text-4xl tracking-tight text-neutral-50 mb-2">
            Welcome back, {greetingName}
          </h1>
          <p className="text-neutral-500 font-medium tracking-wide">
            Everything is running smoothly. Here is your overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-[11px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
             <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
             Active Session
           </div>
        </div>
      </motion.div>

      {/* Metrics Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
           title="Active Orders" 
           value={openOrdersCount} 
           label="Open & Billed" 
           icon={<Time size={24} />} 
           accent="blue"
        />
        <MetricCard 
           title="Today's Sales" 
           value={completedOrdersCount} 
           label="Fulfilled Today" 
           icon={<CheckmarkOutline size={24} />} 
           accent="orange"
        />
        <MetricCard 
           title="Daily Revenue" 
           value={formattedRevenue} 
           label="Net Revenue" 
           icon={<Analytics size={24} />} 
           accent="green"
           isDark
        />
      </motion.div>

      {/* Activity & Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Live Activity Stream */}
         <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6 flex flex-col">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                 <div className="bg-neutral-900 size-10 rounded-xl border border-neutral-800 flex items-center justify-center text-neutral-400">
                    <Activity size={20} />
                 </div>
                 <h2 className="font-semibold text-lg text-neutral-50 tracking-tight">Recent Activity</h2>
              </div>
              <Link href="/pos/orders" className="text-[11px] font-bold text-neutral-500 hover:text-neutral-300 uppercase tracking-[0.2em] transition-colors">View Monitor</Link>
            </div>
            
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden backdrop-blur-sm flex-1">
               {recentActivity.length === 0 ? (
                 <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                    <div className="size-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6 text-neutral-700 opacity-50">
                       <Receipt size={32} />
                    </div>
                    <p className="text-[11px] font-bold text-neutral-600 uppercase tracking-[0.2em]">No Recent Activity</p>
                    <p className="text-[13px] text-neutral-700 mt-2 max-w-[200px]">Successful transactions will be listed here in real-time.</p>
                 </div>
               ) : (
                 <div className="divide-y divide-neutral-800/50">
                    {recentActivity.map((activity, i) => (
                      <div key={i} className="p-5 flex items-center justify-between hover:bg-neutral-900 transition-all duration-300 group">
                         <div className="flex items-center gap-4">
                            <div className={cn(
                              "size-10 rounded-xl flex items-center justify-center border transition-all duration-300",
                              activity.status === 'Completed' ? 'bg-green-500/5 border-green-500/20 text-green-500' :
                              activity.status === 'Preparing' ? 'bg-orange-500/5 border-orange-500/20 text-orange-500' :
                              'bg-blue-500/5 border-blue-500/20 text-blue-500'
                            )}>
                               {activity.status === 'Completed' ? <CheckmarkOutline size={18} /> : <Time size={18} />}
                            </div>
                            <div>
                               <div className="font-bold text-neutral-100 text-[14px] group-hover:text-white transition-colors uppercase tracking-tight">{activity.id}</div>
                               <div className="text-neutral-500 text-[11px] font-medium tracking-wide mt-0.5">{activity.type} • {activity.time}</div>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="font-bold text-neutral-50 text-[15px] tabular-nums tracking-tighter">{activity.amount}</div>
                            <div className={cn(
                              "text-[10px] font-bold uppercase tracking-widest mt-1",
                              activity.status === 'Completed' ? 'text-green-500' :
                              activity.status === 'Preparing' ? 'text-orange-500' :
                              'text-blue-500'
                            )}>{activity.status}</div>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
         </motion.div>

         {/* Velocity Chart / Top Items */}
         <motion.div variants={itemVariants} className="space-y-6 flex flex-col">
            <div className="flex items-center gap-3 px-2">
                 <div className="bg-neutral-900 size-10 rounded-xl border border-neutral-800 flex items-center justify-center text-neutral-400">
                    <ChartBar size={20} />
                 </div>
                 <h2 className="font-semibold text-lg text-neutral-50 tracking-tight">Demand Insights</h2>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 backdrop-blur-sm flex-1">
               {topItems.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-30 mt-10">
                    <ChartBar size={48} className="mb-4 text-neutral-600" />
                    <p className="text-[11px] font-bold uppercase tracking-widest">No Sales Data</p>
                 </div>
               ) : (
                 <div className="space-y-8">
                    {topItems.map((item, i) => (
                       <div key={i}>
                          <div className="flex justify-between items-center mb-3">
                             <span className="font-bold text-[13px] text-neutral-200">{item.name}</span>
                             <span className="font-mono text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{item.sales.toString().padStart(2, '0')} Orders</span>
                          </div>
                          <div className="h-1.5 w-full bg-neutral-800/50 rounded-full overflow-hidden">
                             <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.sales / item.max) * 100}%` }}
                                transition={{ duration: 1.2, delay: 0.3 + (i * 0.1), ease: "circOut" }}
                                className="h-full bg-neutral-200 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.05)]"
                             />
                          </div>
                       </div>
                    ))}
                 </div>
               )}
            </div>
         </motion.div>
      </div>

      {/* Quick Access Section */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center gap-3 px-2">
             <div className="bg-neutral-900 size-10 rounded-xl border border-neutral-800 flex items-center justify-center text-neutral-400">
                <Folder size={20} />
             </div>
              <h2 className="font-semibold text-lg text-neutral-50 tracking-tight">Quick Operations</h2>
        </div>
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {quickActions.map((action) => (
            <Link
              href={action.href}
              key={action.href}
              className="group relative flex flex-col p-6 rounded-3xl bg-neutral-900/40 border border-neutral-800/80 transition-all duration-500 hover:bg-neutral-900 hover:border-neutral-700 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 size-20 bg-neutral-100/5 blur-3xl rounded-full group-hover:bg-neutral-100/10 transition-colors" />
              
              <div className={cn(
                "size-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 shadow-lg",
                action.accent === 'blue' ? "bg-blue-500 text-white shadow-blue-500/10 group-hover:shadow-blue-500/20" :
                action.accent === 'orange' ? "bg-orange-500 text-white shadow-orange-500/10 group-hover:shadow-orange-500/20" :
                "bg-green-500 text-white shadow-green-500/10 group-hover:shadow-green-500/20"
              )}>
                {action.icon}
              </div>
              <div className="relative z-10">
                <h3 className="font-bold text-[14px] text-neutral-100 mb-1 group-hover:text-white transition-colors">{action.title}</h3>
                <p className="text-neutral-500 text-[11px] font-medium leading-relaxed group-hover:text-neutral-400">
                  {action.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
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
  trend?: string; 
  accent: 'blue' | 'orange' | 'green';
  isDark?: boolean;
}) {
  return (
    <div className={cn(
      "relative overflow-hidden p-8 border rounded-[32px] flex flex-col justify-between h-56 transition-all duration-300",
      isDark 
        ? "bg-neutral-50 border-white shadow-[0_20px_40px_rgba(0,0,0,0.5)] text-black" 
        : "bg-neutral-900/50 border-neutral-800 text-white hover:border-neutral-700"
    )}>
      <div className="flex justify-between items-start relative z-10">
        <div className={cn(
          "size-12 rounded-2xl flex items-center justify-center border transition-colors shadow-lg",
          isDark 
            ? "bg-black/5 border-black/10 text-black" 
            : "bg-neutral-900 border-neutral-800 text-neutral-400"
        )}>
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5",
            isDark 
              ? "bg-black/10 text-black" 
              : accent === 'blue' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                accent === 'orange' ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                "bg-green-500/10 text-green-400 border border-green-500/20"
          )}>
            {trend.includes('%') && <ArrowUpRight size={14} />} {trend}
          </div>
        )}
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

      {/* Background Decorative Element */}
      {!isDark && (
         <div className="absolute -bottom-10 -right-10 size-40 bg-neutral-500/5 blur-3xl rounded-full" />
      )}
    </div>
  );
}
