import { z } from "zod";

// Service Schema
export const servicesSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Service name is required"),
  duration: z.string().min(1, "Duration is required"),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
  therapist: z.string().optional().default(""),
  room: z.string().optional().default(""),
  date: z.string().optional().default(""),
  time: z.string().optional().default(""),
  commission: z.coerce.number().min(0, "Commission must be non-negative"),
});

// Guest Schema
export const guestSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  specialRequest: z.string().optional().nullable(),
});

// Payment Schema
export const paymentSchema = z.object({
  id: z.string().optional(),
  status: z.enum(["pending", "paid", "failed", "refunded"]),
  amount: z.number().min(0, "Amount must be non-negative"),
  date: z.string().optional(),
  paymentType: z
    .enum(["on_arrival", "credit_card", "bank_transfer", "paypal"])
    .optional(),
  note: z.string().optional(),
  paypalOrderId: z.string().optional().nullable(),
});

// Customer Schema
export const customerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  specialRequests: z.string().optional(),
}).nullable();

export const bookingItemsSchema = z.object({
  id: z.string().optional(),
  service: z.string().min(1, "Service is required"),
  name: z.string().min(1, "Booking name is required"),
  duration: z.number().optional(),
  type: z.enum(["sub_service", "package", "programme"]),
  numberOfGuests: z.number({
    required_error: "Number of guests is required",
  }),
  therapist: z.string().optional(),
  room: z.string().optional(),
  bed: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  guests: z.array(guestSchema).min(1, "At least one guest is required"),
});
// Main Booking Schema
export const bookingSchema = z.object({
  id: z.string().optional(),
  bookingId: z.string().optional(),
  bookingItems: z
    .array(bookingItemsSchema)
    .min(1, "At least one booking item is required"),
  date: z.string().optional(),
  customer: customerSchema,
  totalPrice: z.coerce.number().min(0),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  payments: z.array(paymentSchema).default([]),
});

export type BookingFormData = z.infer<typeof bookingSchema>;
export type ServiceData = z.infer<typeof servicesSchema>;
export type PaymentData = z.infer<typeof paymentSchema>;
export type CustomerData = z.infer<typeof customerSchema>;
