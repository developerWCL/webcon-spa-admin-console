import type { BookingFormData, PaymentData } from "../schemas/booking.schema";

/**
 * Calculate remaining balance
 */
export const calculateRemainingBalance = (
  totalPrice: number,
  paidAmount: number,
  appliedDiscount: number,
): number => {
  return totalPrice - paidAmount - appliedDiscount;
};

/**
 * Determine payment status based on amounts
 */
export const determinePaymentStatus = (
  newPaidAmount: number,
  totalPrice: number,
): BookingFormData["paymentStatus"] => {
  if (newPaidAmount === 0) return "unpaid";
  if (newPaidAmount >= totalPrice) return "paid";
  if (newPaidAmount < 0) return "refunded";
  return "partial";
};

/**
 * Calculate discount amount
 */
export const calculateDiscount = (
  totalPrice: number,
  discountValue: number,
  discountType: "percentage" | "fixed",
): number => {
  return discountType === "percentage"
    ? (totalPrice * discountValue) / 100
    : discountValue;
};

/**
 * Get next payment ID
 */
export const getNextPaymentId = (paymentHistory: PaymentData[]): number => {
  return Math.max(0, ...paymentHistory.map((p) => p.id)) + 1;
};

/**
 * Create new payment entry
 */
export const createPaymentEntry = (
  amount: number,
  method: string,
  type: "deposit" | "refund",
  paymentHistory: PaymentData[],
): PaymentData => {
  return {
    id: getNextPaymentId(paymentHistory),
    type,
    amount: type === "refund" ? -amount : amount,
    date: new Date().toISOString().split("T")[0],
    method,
    note: "",
  };
};

/**
 * Get next service ID
 */
export const getNextServiceId = (
  fields: Array<{ id: number | string }>,
): number => {
  return (
    Math.max(0, ...fields.map((f) => (typeof f.id === "number" ? f.id : 0))) + 1
  );
};

/** Format number with comma */
export const formatNumberWithComma = (num: number): string => {
  return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
