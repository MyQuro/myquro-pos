"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Wallet, QrCode, Purchase, TrashCan, CheckmarkFilled } from "@carbon/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type MakePaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  total: number;
  onPaymentSuccess: () => void;
};

type PaymentMethod = "CASH" | "UPI" | "CARD";

type PaymentEntry = {
  id: string;
  method: PaymentMethod;
  amount: number;
  status: "SUCCESS";
};

export default function MakePaymentModal({
  isOpen,
  onClose,
  orderId,
  total,
  onPaymentSuccess,
}: MakePaymentModalProps) {
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("CASH");
  const [amountInput, setAmountInput] = useState<string>("");
  const [tenderedInput, setTenderedInput] = useState<string>("");
  const [isProcessingFinal, setIsProcessingFinal] = useState(false);
  const [actionSimulating, setActionSimulating] = useState(false);

  const totalPaid = useMemo(
    () => payments.reduce((sum, p) => sum + p.amount, 0),
    [payments]
  );
  const balance = total - totalPaid;

  useEffect(() => {
    if (balance > 0) {
      setAmountInput((balance / 100).toFixed(2));
    } else {
      setAmountInput("");
    }
  }, [balance, selectedMethod]);

  const activeAmount = parseFloat(amountInput) || 0;
  const activeAmountPaise = Math.round(activeAmount * 100);

  function handleRemovePayment(id: string) {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }

  const handleQuickTender = (amt: number) => {
    setTenderedInput(amt.toFixed(2));
  };

  const currentTendered = parseFloat(tenderedInput) || 0;
  const changeDue = currentTendered > activeAmount ? currentTendered - activeAmount : 0;

  function confirmCashPayment() {
    if (activeAmountPaise <= 0 || activeAmountPaise > balance) {
      alert("Invalid payment chunk!");
      return;
    }
    setPayments((prev) => [
      ...prev,
      { id: `pay-${Date.now()}`, method: "CASH", amount: activeAmountPaise, status: "SUCCESS" },
    ]);
    setTenderedInput("");
  }

  function simulateProviderHook(method: "UPI" | "CARD", delayMs: number) {
    if (activeAmountPaise <= 0 || activeAmountPaise > balance) {
      alert("Invalid payment chunk!");
      return;
    }
    setActionSimulating(true);
    setTimeout(() => {
      setPayments((prev) => [
        ...prev,
        { id: `pay-${Date.now()}`, method, amount: activeAmountPaise, status: "SUCCESS" },
      ]);
      setActionSimulating(false);
    }, delayMs);
  }

  async function handleCompleteOrder() {
    if (balance !== 0) {
      alert("Balance must hit exactly zero before finalizing the order.");
      return;
    }
    setIsProcessingFinal(true);
    try {
      const res = await fetch(`/api/pos/orders/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payments: payments.map((p) => ({ method: p.method, amount: p.amount })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Payment failed" }));
        alert(err.error || "Payment transaction failed.");
        return;
      }
      onPaymentSuccess();
      resetAndClose();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment failed. Please retry.");
    } finally {
      setIsProcessingFinal(false);
    }
  }

  function resetAndClose() {
    setPayments([]);
    setAmountInput("");
    setTenderedInput("");
    setSelectedMethod("CASH");
    onClose();
  }

  const paymentMethods: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { value: "CASH", label: "Cash Drawer", icon: <Wallet size={20} /> },
    { value: "UPI", label: "Dynamic UPI", icon: <QrCode size={20} /> },
    { value: "CARD", label: "Card Terminal", icon: <Purchase size={20} /> },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-auto max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b bg-neutral-50 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-['Lexend:SemiBold',_sans-serif] text-xl tracking-tight text-neutral-900">
                Checkout
              </DialogTitle>
              <DialogDescription className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-500 mt-1">
                Split funding or pay the total balance.
              </DialogDescription>
            </div>
            <div className="text-right">
              <p className="font-['Lexend:SemiBold',_sans-serif] text-3xl tracking-tighter text-neutral-900">
                ₹{(total / 100).toFixed(2)}
              </p>
              <p className="font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-400">
                Total Bill
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          {/* Left: Payment Source Tabs */}
          <div className="w-full md:w-[200px] shrink-0 border-b md:border-b-0 md:border-r border-neutral-200/60 bg-neutral-100/50 p-4 space-y-2">
            <Label className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-neutral-400 uppercase tracking-wider mb-2 block">
              Source
            </Label>
            <div className="flex md:flex-col gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  disabled={actionSimulating || balance === 0}
                  onClick={() => setSelectedMethod(method.value)}
                  className={cn(
                    "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 flex-1 md:flex-none",
                    selectedMethod === method.value
                      ? "bg-white border-neutral-900 shadow-sm ring-1 ring-neutral-900"
                      : "bg-transparent border-transparent text-neutral-500 hover:bg-neutral-200/50",
                    (actionSimulating || balance === 0) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className={cn(selectedMethod === method.value ? "text-neutral-900" : "text-neutral-400")}>
                    {method.icon}
                  </span>
                  <span className={cn("font-['Lexend:Medium',_sans-serif] text-[13px]", selectedMethod === method.value ? "text-neutral-900" : "text-neutral-500")}>
                    {method.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Active method UI */}
          <div className="flex-1 p-6 flex flex-col">
            {/* Amount Input */}
            <div className="space-y-2 mb-6">
              <Label className="font-['Lexend:Medium',_sans-serif] text-[13px] text-neutral-600 block">
                Split Funding Amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-['Lexend:Medium',_sans-serif] text-neutral-400">₹</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={actionSimulating || balance === 0}
                  className="pl-7 h-11 border-neutral-200 bg-neutral-50/50 font-['Lexend:Medium',_sans-serif] text-lg rounded-xl"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                />
              </div>
            </div>

            {balance === 0 ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center p-8 bg-green-50 rounded-2xl border border-green-200 text-green-700 mb-6"
              >
                <CheckmarkFilled size={48} className="mb-2" />
                <p className="font-['Lexend:SemiBold',_sans-serif] text-lg tracking-tight">Balance Settled</p>
                <p className="font-['Lexend:Regular',_sans-serif] text-[13px] opacity-80 text-center mt-1">
                  All payment chunks verified.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedMethod}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-6"
              >
                {selectedMethod === "CASH" && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleQuickTender(500)} className="flex-1 rounded-lg border-neutral-200 font-['Lexend:Medium',_sans-serif]">₹500</Button>
                      <Button variant="outline" size="sm" onClick={() => handleQuickTender(1000)} className="flex-1 rounded-lg border-neutral-200 font-['Lexend:Medium',_sans-serif]">₹1000</Button>
                      <Button variant="outline" size="sm" onClick={() => handleQuickTender(2000)} className="flex-1 rounded-lg border-neutral-200 font-['Lexend:Medium',_sans-serif]">₹2000</Button>
                    </div>
                    <div className="flex gap-4 items-end">
                      <div className="flex-1 space-y-1">
                        <Label className="font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-500">Cash Tendered</Label>
                        <Input type="number" step="0.01" value={tenderedInput} onChange={(e) => setTenderedInput(e.target.value)} className="h-10 border-neutral-200 font-['Lexend:Medium',_sans-serif]" />
                      </div>
                      <div className="flex-1 p-3 rounded-lg bg-red-50 border border-red-100">
                        <p className="font-['Lexend:Regular',_sans-serif] text-[11px] text-red-500 uppercase tracking-widest leading-none mb-1">Change Due</p>
                        <p className="font-['Lexend:SemiBold',_sans-serif] text-lg text-red-600 leading-none">₹{changeDue > 0 ? changeDue.toFixed(2) : "0.00"}</p>
                      </div>
                    </div>
                    <Button onClick={confirmCashPayment} className="w-full h-11 rounded-xl bg-neutral-900 text-white font-['Lexend:Medium',_sans-serif]">
                      Confirm Cash Intake
                    </Button>
                  </div>
                )}

                {selectedMethod === "UPI" && (
                  <div className="flex flex-col items-center justify-center p-6 bg-blue-50/50 border border-blue-100 rounded-2xl text-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                        `upi://pay?pa=store@upi&pn=MyQuro_POS&cu=INR&am=${activeAmount.toFixed(2)}`
                      )}`}
                      alt="Scan QR"
                      className="w-32 h-32 rounded-xl shadow-sm bg-white p-2 mb-4"
                    />
                    <Button
                      onClick={() => simulateProviderHook("UPI", 2000)}
                      disabled={actionSimulating}
                      className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-['Lexend:Medium',_sans-serif]"
                    >
                      {actionSimulating ? "Awaiting Webhook..." : "Verify UPI Payment"}
                    </Button>
                  </div>
                )}

                {selectedMethod === "CARD" && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-6", actionSimulating ? "bg-orange-100 text-orange-600 animate-pulse" : "bg-neutral-100 text-neutral-400")}>
                      <Purchase size={40} />
                    </div>
                    <Button
                      onClick={() => simulateProviderHook("CARD", 3000)}
                      disabled={actionSimulating}
                      className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-['Lexend:Medium',_sans-serif]"
                    >
                      {actionSimulating ? "Awaiting Terminal Swipe..." : "Push to Remote Terminal"}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Ledger */}
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-3 border-b border-neutral-200/60 pb-2">
                <p className="font-['Lexend:Medium',_sans-serif] text-[13px] text-neutral-400">Balance Due</p>
                <p className="font-['Lexend:SemiBold',_sans-serif] text-xl text-neutral-900">₹{(balance / 100).toFixed(2)}</p>
              </div>

              <AnimatePresence>
                {payments.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.9 }}
                    className="flex items-center justify-between p-3 mb-2 rounded-xl bg-green-50 border border-green-200/60"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-green-200/50 flex items-center justify-center text-green-700">
                        <CheckmarkFilled size={16} />
                      </span>
                      <div>
                        <p className="font-['Lexend:Medium',_sans-serif] text-[13px] text-green-900 leading-tight">Verified</p>
                        <p className="font-['Lexend:Regular',_sans-serif] text-[11px] text-green-700">{p.method}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-['Lexend:SemiBold',_sans-serif] text-[15px] text-green-900">₹{(p.amount / 100).toFixed(2)}</p>
                      <button onClick={() => handleRemovePayment(p.id)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                        <TrashCan size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <Button
                onClick={handleCompleteOrder}
                disabled={balance !== 0 || isProcessingFinal}
                className="w-full h-12 mt-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-['Lexend:Medium',_sans-serif] shadow-lg disabled:opacity-50"
              >
                {isProcessingFinal ? "Processing..." : "Complete Transaction"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}