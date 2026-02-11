"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type MakePaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  total: number;
  onPaymentSuccess: () => void;
};

type PaymentMethod = "CASH" | "UPI" | "CARD";

export default function MakePaymentModal({
  isOpen,
  onClose,
  orderId,
  total,
  onPaymentSuccess,
}: MakePaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("CASH");
  const [isProcessing, setIsProcessing] = useState(false);

  async function handlePayment() {
    setIsProcessing(true);

    try {
      const res = await fetch(`/api/pos/orders/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: selectedMethod }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Payment failed" }));
        alert(err.error || "Payment failed");
        return;
      }

      // Payment successful
      onPaymentSuccess();
      onClose();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  const paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: "CASH", label: "Cash", icon: "💵" },
    { value: "UPI", label: "UPI", icon: "📱" },
    { value: "CARD", label: "Card", icon: "💳" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Make Payment</DialogTitle>
          <DialogDescription>
            Select a payment method to complete the order.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Amount Display */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
            <p className="text-3xl font-bold">₹{(total / 100).toFixed(2)}</p>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setSelectedMethod(method.value)}
                  className={`
                    flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                    ${
                      selectedMethod === method.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }
                  `}
                >
                  <span className="text-2xl mb-1">{method.icon}</span>
                  <span className="text-sm font-medium">{method.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </>
            ) : (
              `Pay ₹${(total / 100).toFixed(2)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}