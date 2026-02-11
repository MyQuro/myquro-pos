"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Period = "daily" | "weekly" | "monthly" | "custom";

interface ReportData {
  period: string;
  start: string;
  end: string;
  totalOrders: number;
  totalRevenue: number;
  paymentBreakdown: {
    cash: number;
    upi: number;
    card: number;
  };
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert amount from paise to rupees and round to 2 decimal places
  const convertAmount = (amount: number) => {
    return Math.round((amount / 100) * 100) / 100;
  };

  // Build URL for API call
  const buildApiUrl = (format?: "csv" | "json") => {
    let url = "/api/pos/reports/summary?";

    if (period === "custom") {
      url += `from=${customFrom}&to=${customTo}`;
    } else {
      url += `period=${period}`;
    }

    if (format === "csv") {
      url += "&format=csv";
    }

    return url;
  };

  // Fetch report data
  const fetchReport = async () => {
    setLoading(true);
    setError(null);

    try {
      if (period === "custom" && (!customFrom || !customTo)) {
        setError("Please select both start and end dates for custom range");
        setLoading(false);
        return;
      }

      const response = await fetch(buildApiUrl());

      if (!response.ok) {
        throw new Error("Failed to fetch report");
      }

      const data = await response.json();

      // Convert all amounts from paise to rupees
      const convertedData = {
        ...data,
        totalRevenue: convertAmount(data.totalRevenue),
        paymentBreakdown: {
          cash: convertAmount(data.paymentBreakdown.cash),
          upi: convertAmount(data.paymentBreakdown.upi),
          card: convertAmount(data.paymentBreakdown.card),
        },
      };

      setReportData(convertedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = async () => {
    try {
      if (period === "custom" && (!customFrom || !customTo)) {
        setError("Please select both start and end dates for custom range");
        return;
      }

      const response = await fetch(buildApiUrl("csv"));

      if (!response.ok) {
        throw new Error("Failed to export report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales-report-${period}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export CSV");
    }
  };

  // Auto-fetch when period changes (except custom)
  useEffect(() => {
    if (period !== "custom") {
      fetchReport();
    }
  }, [period]);

  // Get today's date for daily report default
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format date range
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })} - ${endDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sales Reports</h1>
        
        {/* Export Button */}
        {reportData && (
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="gap-2"
          >
            <span>📥</span>
            Export CSV
          </Button>
        )}
      </div>

      {/* Period Selection */}
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-medium">Select Report Period</h2>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={period === "daily" ? "default" : "outline"}
            onClick={() => setPeriod("daily")}
          >
            Daily
          </Button>
          <Button
            variant={period === "weekly" ? "default" : "outline"}
            onClick={() => setPeriod("weekly")}
          >
            Weekly
          </Button>
          <Button
            variant={period === "monthly" ? "default" : "outline"}
            onClick={() => setPeriod("monthly")}
          >
            Monthly
          </Button>
          <Button
            variant={period === "custom" ? "default" : "outline"}
            onClick={() => setPeriod("custom")}
          >
            Custom Range
          </Button>
        </div>

        {/* Custom Date Range */}
        {period === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="from">From Date</Label>
              <Input
                id="from"
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">To Date</Label>
              <Input
                id="to"
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Button onClick={fetchReport} disabled={loading}>
                {loading ? "Loading..." : "Generate Report"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white border rounded-lg p-12 text-center">
          <div className="text-gray-500">Loading report data...</div>
        </div>
      )}

      {/* Report Data */}
      {!loading && reportData && (
        <div className="space-y-6">
          {/* Report Header */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-medium mb-2">Report Period</h2>
            <p className="text-gray-600">
              {formatDateRange(reportData.start, reportData.end)}
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Orders */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {reportData.totalOrders}
                  </p>
                </div>
                <div className="text-4xl">📦</div>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(reportData.totalRevenue)}
                  </p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Payment Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cash */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💵</span>
                  <span className="font-medium">Cash</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(reportData.paymentBreakdown.cash)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {reportData.totalRevenue > 0
                    ? `${(
                        (reportData.paymentBreakdown.cash /
                          reportData.totalRevenue) *
                        100
                      ).toFixed(1)}%`
                    : "0%"}
                </p>
              </div>

              {/* UPI */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📱</span>
                  <span className="font-medium">UPI</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(reportData.paymentBreakdown.upi)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {reportData.totalRevenue > 0
                    ? `${(
                        (reportData.paymentBreakdown.upi /
                          reportData.totalRevenue) *
                        100
                      ).toFixed(1)}%`
                    : "0%"}
                </p>
              </div>

              {/* Card */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💳</span>
                  <span className="font-medium">Card</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(reportData.paymentBreakdown.card)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {reportData.totalRevenue > 0
                    ? `${(
                        (reportData.paymentBreakdown.card /
                          reportData.totalRevenue) *
                        100
                      ).toFixed(1)}%`
                    : "0%"}
                </p>
              </div>
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-medium mb-2">Average Order Value</h2>
            <p className="text-3xl font-bold text-blue-600">
              {reportData.totalOrders > 0
                ? formatCurrency(reportData.totalRevenue / reportData.totalOrders)
                : formatCurrency(0)}
            </p>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!loading && !reportData && !error && (
        <div className="bg-white border rounded-lg p-12 text-center">
          <p className="text-gray-500">
            Select a period to view sales reports
          </p>
        </div>
      )}
    </div>
  );
}