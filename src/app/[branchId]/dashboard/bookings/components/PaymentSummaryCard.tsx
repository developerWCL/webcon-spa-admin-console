"use client";

import { useState } from "react";
import { CheckCircle2, Plus, Trash2, Clock, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { paymentMethodOptions } from "../constants";
import type { PaymentData } from "../../../../../schemas/booking.schema";

interface PaymentSummaryCardProps {
  subtotal: number;
  appliedDiscount: number;
  appliedCoupon: {
    code: string;
    discount: number;
    type: "percentage" | "fixed";
  } | null;
  couponCode: string;
  onCouponCodeChange: (code: string) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  availableCoupons: Array<{
    code: string;
    discount: number;
    type: "percentage" | "fixed";
  }>;
  onAddPaymentClick: () => void;
  method: "on_arrival" | "credit_card" | "bank_transfer" | "paypal" | undefined;

  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  onPaymentStatusChange: (
    status: "pending" | "paid" | "failed" | "refunded",
  ) => void;
  methodError?: string;
  statusError?: string;
  couponError?: string;
  payments?: PaymentData[];
  onPaymentAdded?: (payment: PaymentData) => void;
  onPaymentRemoved?: (paymentId: string) => void;
  onPaymentUpdated?: (payment: PaymentData) => void;
  tempPaymentAmount?: number;
  onTempPaymentAmountChange?: (amount: number) => void;
  isCreating: boolean;
  transactionId?: string;
}

export function PaymentSummaryCard({
  subtotal,
  appliedDiscount,
  appliedCoupon,
  couponCode,
  onCouponCodeChange,
  onApplyCoupon,
  onRemoveCoupon,
  availableCoupons,
  onAddPaymentClick,
  method,
  onMethodChange,
  paymentStatus,
  onPaymentStatusChange,
  methodError,
  statusError,
  couponError,
  payments = [],
  onPaymentAdded,
  onPaymentRemoved,
  onPaymentUpdated,
  tempPaymentAmount = 0,
  onTempPaymentAmountChange,
  isCreating,
  transactionId,
}: PaymentSummaryCardProps) {
  const [editingPayment, setEditingPayment] = useState<PaymentData | null>(
    null,
  );
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editMethod, setEditMethod] = useState<string>("");
  const [editStatus, setEditStatus] = useState<
    "pending" | "paid" | "failed" | "refunded"
  >("pending");

  const handleEditPayment = (payment: PaymentData) => {
    setEditingPayment(payment);
    setEditAmount(Number(payment.amount || 0));
    setEditMethod(payment.paymentType || "");
    setEditStatus(payment.status as "pending" | "paid" | "failed" | "refunded");
  };

  const handleSaveChanges = () => {
    if (!editingPayment) return;

    const updatedPayment: PaymentData = {
      ...editingPayment,
      id: editingPayment.id,
      amount: editAmount,
      paymentType: editMethod as
        | "on_arrival"
        | "credit_card"
        | "bank_transfer"
        | "paypal",
      status: editStatus,
    };

    onPaymentUpdated?.(updatedPayment);
    setEditingPayment(null);
  };
  const total = subtotal - appliedDiscount;
  const totalPaid = payments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0,
  );
  const remainingToPay = Math.max(0, total - totalPaid);
  const remainingPayable =
    payments[0]?.status === "refunded"
      ? 0
      : Math.max(0, subtotal - appliedDiscount - totalPaid);

  const handleAddPayment = () => {
    if (!method) {
      return;
    }

    const newPayment: PaymentData = {
      id: Date.now().toString(),
      amount: remainingToPay,
      paymentType: method,
      status: paymentStatus,
      date: new Date().toISOString().split("T")[0],
    };

    onPaymentAdded?.(newPayment);

    // Reset form
    onTempPaymentAmountChange?.(0);
  };

  const getPaymentMethodLabel = (methodValue: string) => {
    return (
      paymentMethodOptions.find((opt) => opt.value === methodValue)?.label ||
      methodValue
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">
              ฿
              {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          {appliedCoupon && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount ({appliedCoupon?.code})</span>
              <span>
                -฿
                {Number(appliedDiscount || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          )}

          <Separator />
          <div className="flex justify-between">
            <span className="font-medium">Total Amount</span>
            <span className={`font-bold text-lg text-green-600`}>
              ฿{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Payments Added Section */}
        {payments.length > 0 && (
          <div className="pt-4 border-t space-y-3">
            <Label className="text-sm font-semibold">Payments Added</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-start justify-between p-3 border rounded-md bg-muted/50 text-sm"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {payment.status === "paid" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : payment.status === "pending" ? (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <X className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">
                        ฿
                        {Number(payment.amount || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getPaymentMethodLabel(payment.paymentType || "")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.date} • {payment.status}
                    </p>
                  </div>
                  {isCreating ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onPaymentRemoved?.(payment.id || "")}
                      className="h-7"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditPayment(payment)}
                      className="h-7"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Payment Summary */}
            <div className="pt-2 border-t space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Total Paid</span>
                <span className="text-green-600">
                  ฿
                  {Number(totalPaid).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div
                className={`flex justify-between text-sm font-bold ${
                  remainingToPay === 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                <span>Remaining to Pay</span>
                <span>
                  ฿
                  {Number(remainingPayable).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              {transactionId && (
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs">{transactionId}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Coupon Section */}
        <div className="pt-4 border-t space-y-3">
          <Label className="text-sm font-semibold">Apply Coupon</Label>
          {!appliedCoupon ? (
            <>
              {isCreating ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) =>
                        onCouponCodeChange(e.target.value.toUpperCase())
                      }
                      className="uppercase"
                    />
                    <Button
                      type="button"
                      onClick={onApplyCoupon}
                      variant="outline"
                      disabled={!couponCode}
                      size="sm"
                    >
                      Apply
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-sm text-red-500">{couponError}</p>
                  )}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Available coupons:
                    </p>
                    <div className="grid gap-2 max-h-40 overflow-y-auto">
                      {availableCoupons.map((coupon) => (
                        <div
                          key={coupon.code}
                          className="flex items-center justify-between p-2 border rounded-md bg-muted/50 text-sm"
                        >
                          <div>
                            <p className="font-medium font-mono">
                              {coupon.code}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {coupon.type === "percentage"
                                ? `${coupon.discount}% off`
                                : `฿${coupon.discount} off`}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              onCouponCodeChange(coupon.code);
                              onApplyCoupon();
                            }}
                            className="h-7"
                          >
                            Use
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No coupon applied
                </p>
              )}
            </>
          ) : (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">
                      {appliedCoupon.code}
                    </p>
                    <p className="text-xs text-green-700">
                      {appliedCoupon.type === "percentage"
                        ? `${appliedCoupon.discount}% discount`
                        : `฿${appliedCoupon.discount} discount`}
                    </p>
                  </div>
                </div>
                {isCreating && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={onRemoveCoupon}
                    className="h-7"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Add Payment Section */}
        {payments.length === 0 && (
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-sm font-semibold">Add Payment</Label>
            <div className="space-y-2">
              <Label className="text-xs">Amount (฿)</Label>
              <Input
                type="number"
                value={remainingPayable}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Auto-filled with remaining amount to pay
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Payment Method</Label>
              <Select value={method || ""} onValueChange={onMethodChange}>
                <SelectTrigger
                  className={`w-full ${methodError ? "border-red-500" : ""}`}
                >
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
              {methodError && (
                <p className="text-sm text-red-500">{methodError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Payment Status</Label>
              <Select
                value={paymentStatus}
                onValueChange={onPaymentStatusChange}
              >
                <SelectTrigger
                  className={`w-full ${statusError ? "border-red-500" : ""}`}
                >
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
              {statusError && (
                <p className="text-sm text-red-500">{statusError}</p>
              )}
            </div>

            <Button
              type="button"
              onClick={handleAddPayment}
              disabled={!method || remainingPayable === 0}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payment
            </Button>
          </div>
        )}
      </CardContent>

      {/* Edit Payment Modal */}
      <Dialog
        open={!!editingPayment}
        onOpenChange={() => setEditingPayment(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount" className="text-xs">
                Amount (฿)
              </Label>
              <Input
                id="edit-amount"
                type="number"
                value={editAmount || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Amount cannot be edited
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-method" className="text-xs">
                Payment Method
              </Label>
              <Select value={editMethod} onValueChange={setEditMethod}>
                <SelectTrigger id="edit-method" className="w-full">
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
              <Label htmlFor="edit-status" className="text-xs">
                Payment Status
              </Label>
              <Select
                value={editStatus}
                onValueChange={(value: any) => setEditStatus(value)}
              >
                <SelectTrigger id="edit-status" className="w-full">
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
              onClick={() => setEditingPayment(null)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveChanges}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
