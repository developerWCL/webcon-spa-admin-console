import type { BookingFormData } from "../../../../schemas/booking.schema";

// Service Status Configuration
export const serviceStatusConfig = {
  pending: { label: "Pending", variant: "outline" as const },
  confirmed: { label: "Confirmed", variant: "default" as const },
  "in-progress": { label: "In Progress", variant: "secondary" as const },
  completed: { label: "Completed", variant: "default" as const },
  cancelled: { label: "Cancelled", variant: "destructive" as const },
};

// Therapist Options (can be fetched from API later)
export const therapistOptions = [
  { value: "Emma Wilson", label: "Emma Wilson" },
  { value: "Lisa Anderson", label: "Lisa Anderson" },
  { value: "John Smith", label: "John Smith" },
  { value: "Sarah Brown", label: "Sarah Brown" },
];

// Room Options (can be fetched from API later)
export const roomOptions = [
  { value: "Room 1", label: "Room 1" },
  { value: "Room 2", label: "Room 2" },
  { value: "Room 3", label: "Room 3" },
  { value: "Room 4", label: "Room 4" },
];

// Payment Method Options
export const paymentMethodOptions = [
  { value: "on_arrival", label: "On Arrival" },
  { value: "credit_card", label: "Credit Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "paypal", label: "PayPal" },
];

// Booking Status Options
export const bookingStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

// Payment Status Options
export const paymentStatusOptions = [
  { value: "pending", label: "Pending" },
  // { value: "failed", label: "Failed" },
  { value: "paid", label: "Fully Paid" },
  { value: "refunded", label: "Refunded" },
];
