"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Analytics, 
  ChartLine, 
  ChartBar, 
  Growth, 
  Money, 
  Purchase,
  ChevronRight,
  Download,
  Calendar,
  Wallet,
  Enterprise,
  Group,
  Receipt
} from "@carbon/icons-react";
import { motion, AnimatePresence } from "framer-motion";

type Period = "daily" | "weekly" | "monthly" | "custom";

interface ReportData {
  period: string;
  start: string;
  end: string;
  totalOrders: number;
  totalRevenue: number;
  totalCost: number;
  topProducts: {
    name: string;
    totalQuantity: number;
    revenue: number;
    category: string;
  }[];
  customerSegments: {
    segment: string;
    count: number;
    revenue: number;
  }[];
  paymentBreakdown: {
    cash: number;
    upi: number;
    card: number;
  };
}

const softSpringEasing = [0.25, 1.1, 0.4, 1] as [number, number, number, number];

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertAmount = (amount: number) => Math.round((amount / 100) * 100) / 100;

  const buildApiUrl = (format?: "csv" | "json") => {
    let url = "/api/pos/reports/summary?";
    if (period === "custom") {
      url += `from=${customFrom}&to=${customTo}`;
    } else {
      url += `period=${period}`;
    }
    if (format === "csv") url += "&format=csv";
    return url;
  };

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      if (period === "custom" && (!customFrom || !customTo)) {
        setError("Please Select Date Range");
        setLoading(false);
        return;
      }
      const response = await fetch(buildApiUrl());
      if (!response.ok) throw new Error("Failed to Fetch Data");
      const data = await response.json();
      const convertedData = {
        ...data,
        totalRevenue: convertAmount(data.totalRevenue),
        totalCost: convertAmount(data.totalCost || 0),
        paymentBreakdown: {
          cash: convertAmount(data.paymentBreakdown.cash),
          upi: convertAmount(data.paymentBreakdown.upi),
          card: convertAmount(data.paymentBreakdown.card),
        },
      };
      setReportData(convertedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error Occurred");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      const response = await fetch(buildApiUrl("csv"));
      if (!response.ok) throw new Error("Export Failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales-${period}-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      setError("Export Failed");
    }
  };

  useEffect(() => {
    if (period !== "custom") fetchReport();
  }, [period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto dark">
      {/* Header Area */}
      <div className="flex justify-between items-end border-b border-neutral-800 pb-6">
        <div>
          <h2 className="text-3xl font-semibold text-neutral-50 tracking-tight flex items-center gap-3">
            <Analytics size={32} className="text-neutral-400" />
            Analytics
          </h2>
          <p className="text-neutral-400 text-sm mt-1">Strategic insights for your business operations.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={exportToCSV}
            disabled={!reportData}
            className="border-neutral-800 text-neutral-300 hover:bg-neutral-900 rounded-xl px-5 h-11 flex gap-2 font-medium transition-all active:scale-95"
          >
            <Download size={20} />
            Export Data
          </Button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-[#0d0d0d] border border-neutral-800 p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-center">
        <div className="flex bg-neutral-900 p-1.5 rounded-xl border border-neutral-800">
          {(["daily", "weekly", "monthly", "custom"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
                ${period === p ? "bg-neutral-50 text-black shadow-lg" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              {p}
            </button>
          ))}
        </div>

        {period === "custom" && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="flex flex-wrap items-center gap-4 flex-1"
          >
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 focus-within:border-neutral-500 transition-colors">
              <Calendar size={18} className="text-neutral-500" />
              <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="bg-transparent border-none text-neutral-300 p-0 h-auto focus-visible:ring-0" />
            </div>
            <span className="text-neutral-600">—</span>
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 focus-within:border-neutral-500 transition-colors">
              <Calendar size={18} className="text-neutral-500" />
              <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="bg-transparent border-none text-neutral-300 p-0 h-auto focus-visible:ring-0" />
            </div>
            <Button onClick={fetchReport} disabled={loading} className="bg-neutral-50 text-black px-6 rounded-xl hover:bg-neutral-200">
              {loading ? "Generating..." : "Generate"}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Error / Loading */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-center">
            {error}
          </motion.div>
        )}
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 flex flex-col items-center gap-4">
            <div className="animate-spin size-8 border-2 border-neutral-700 border-t-neutral-100 rounded-full" />
            <p className="text-neutral-500 font-light tracking-widest text-xs uppercase">Synthesizing Ledger Records...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics Content */}
      {!loading && reportData && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="space-y-6"
        >
          {/* Top Line Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard title="Gross Revenue" value={formatCurrency(reportData.totalRevenue)} icon={<Money size={20} />} trend="+14.2%" />
            <SummaryCard title="Net Profit" value={formatCurrency(reportData.totalRevenue - reportData.totalCost)} icon={<Growth size={20} />} trend="+8.1%" negative={reportData.totalRevenue < reportData.totalCost} />
            <SummaryCard title="Volume" value={reportData.totalOrders.toString()} icon={<Receipt size={20} />} trend="+22" />
            <SummaryCard title="Avg Basket" value={formatCurrency(reportData.totalOrders > 0 ? reportData.totalRevenue / reportData.totalOrders : 0)} icon={<Wallet size={20} />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Inventory Impact */}
            <div className="lg:col-span-2 bg-[#090909] border border-neutral-800 p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
                  <ChartBar size={20} className="text-neutral-500" />
                  Velocity Leaders
                </h3>
              </div>
              <div className="space-y-4">
                {reportData.topProducts.map((p, i) => (
                  <div key={i} className="group flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 font-bold text-xs">
                      0{i+1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-neutral-200 group-hover:text-neutral-50 transition-colors uppercase tracking-tight font-medium">{p.name}</span>
                        <span className="text-neutral-400 font-mono">{p.totalQuantity} units</span>
                      </div>
                      <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${(p.revenue / (reportData.totalRevenue * 100)) * 100}%` }} 
                          transition={{ duration: 1, delay: 0.2 + i*0.1 }}
                          className="bg-neutral-100 h-full rounded-full group-hover:bg-green-500 transition-colors" 
                        />
                      </div>
                    </div>
                    <div className="text-right tabular-nums text-sm font-semibold text-neutral-300 pr-2">
                      {formatCurrency(p.revenue / 100)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Systems */}
            <div className="bg-[#090909] border border-neutral-800 p-6 rounded-2xl flex flex-col">
              <h3 className="text-lg font-semibold text-neutral-100 mb-6 flex items-center gap-2">
                <Wallet size={20} className="text-neutral-500" />
                Settlements
              </h3>
              <div className="space-y-6 flex-1 flex flex-col justify-center">
                <SettlementItem label="UPI Transfers" amount={reportData.paymentBreakdown.upi} total={reportData.totalRevenue} color="bg-blue-500" />
                <SettlementItem label="Cash On Hand" amount={reportData.paymentBreakdown.cash} total={reportData.totalRevenue} color="bg-amber-500" />
                <SettlementItem label="Card / POS" amount={reportData.paymentBreakdown.card} total={reportData.totalRevenue} color="bg-neutral-500" />
              </div>
              <div className="mt-8 pt-6 border-t border-neutral-800 flex justify-between items-center text-xs">
                <span className="text-neutral-500 uppercase tracking-widest">Efficiency Rating</span>
                <span className="text-green-500 font-bold">OPTIMIZED</span>
              </div>
            </div>

            {/* Segmentation */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#090909] border border-neutral-800 p-6 rounded-2xl md:col-span-2">
                <h3 className="text-lg font-semibold text-neutral-100 mb-6 flex items-center gap-2">
                  <Group size={20} className="text-neutral-500" />
                  Client Segmentation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {reportData.customerSegments.map((c, i) => (
                      <div key={i} className="flex gap-4 items-center">
                        <div className="size-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center p-2">
                          <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-tighter">SHARE</span>
                          <span className="text-neutral-50 text-lg font-bold">
                            {reportData.totalRevenue > 0 ? Math.round((c.revenue / (reportData.totalRevenue * 100)) * 100) : 0}%
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-100 uppercase tracking-tight">{c.segment} Business</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{c.count} Conversions</p>
                          <p className="text-sm text-green-500 font-bold mt-1 font-mono">{formatCurrency(c.revenue / 100)}</p>
                        </div>
                      </div>
                   ))}
                </div>
              </div>

              <div className="bg-neutral-50 rounded-2xl p-6 flex flex-col justify-between group overflow-hidden relative">
                <div className="relative z-10">
                   <h3 className="text-black font-bold text-sm uppercase tracking-widest mb-1">Growth Forecast</h3>
                   <p className="text-black/60 text-xs">Based on current trajectory</p>
                </div>
                <div className="relative z-10 py-4">
                  <p className="text-5xl font-black text-black">↑12%</p>
                </div>
                <div className="relative z-10 flex justify-between items-center">
                  <span className="text-[10px] bg-black/10 px-2 py-1 rounded text-black font-bold">NEXT PERIOD</span>
                  <ChevronRight size={20} className="text-black/40 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                  <Growth size={120} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && !reportData && !error && (
        <div className="py-20 text-center border-2 border-dashed border-neutral-800 rounded-3xl text-neutral-500">
          <ChartLine size={48} className="mx-auto mb-4 opacity-20" />
          <p>Select parameters to generate operational intelligence.</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, icon, trend, negative }: { title: string; value: string; icon: React.ReactNode; trend?: string; negative?: boolean }) {
  return (
    <div className="bg-[#090909] border border-neutral-800 p-5 rounded-2xl hover:border-neutral-700 transition-colors">
      <div className="flex items-center justify-between text-neutral-500 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest">{title}</span>
        <div className="p-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-300">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-neutral-50 tracking-tighter tabular-nums">{value}</span>
      </div>
      {trend && (
        <div className={`mt-2 text-[10px] font-bold flex items-center gap-1 ${negative ? 'text-red-500' : 'text-green-500'}`}>
          {negative ? '↓' : '↑'} {trend}
          <span className="text-neutral-600 font-medium">vs prev period</span>
        </div>
      )}
    </div>
  );
}

function SettlementItem({ label, amount, total, color }: { label: string; amount: number; total: number; color: string }) {
  const percentage = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div className="group">
      <div className="flex justify-between items-end mb-2">
        <span className="text-xs font-medium text-neutral-400 group-hover:text-neutral-300 transition-colors">{label}</span>
        <span className="text-sm font-semibold text-neutral-50 font-mono">₹{amount.toLocaleString()}</span>
      </div>
      <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${percentage}%` }} 
          transition={{ duration: 1, ease: softSpringEasing }}
          className={`${color} h-full rounded-full opacity-80 group-hover:opacity-100 transition-opacity`} 
        />
      </div>
    </div>
  );
}