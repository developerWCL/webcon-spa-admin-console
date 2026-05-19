"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { paymentMethodOptions } from "../constants";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentAction: "deposit" | "refund";
  amount: number;
  // onAmountChange: (amount: number) => void;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  onPaymentStatusChange: (status: string) => void;
  method: string;
  onMethodChange: (method: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export function PaymentDialog({
  open,
  onOpenChange,
  paymentAction,
  amount,
  //onAmountChange,
  paymentStatus,
  onPaymentStatusChange,
  method,
  onMethodChange,
  onSubmit,
  isLoading = false,
}: PaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {paymentAction === "deposit" ? "Add Payment" : "Process Refund"}
          </DialogTitle>
          <DialogDescription>
            {paymentAction === "deposit"
              ? "Record a payment for this booking"
              : "Process a refund for this booking"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Amount (฿)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount || ""}
              disabled
              // onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={method} onValueChange={onMethodChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Payment Status</Label>
            <Select value={paymentStatus} onValueChange={onPaymentStatusChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {["pending", "paid", "refunded"].map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isLoading}>
            {isLoading
              ? "Processing..."
              : paymentAction === "deposit"
                ? "Add Payment"
                : "Process Refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
