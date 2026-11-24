import { z } from "zod";

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const TimeFormatSchema = z
  .string()
  .regex(
    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    "Time must be in HH:mm format (e.g., 09:00)",
  );

export const OperatingHourSchema = z
  .object({
    dayOfWeek: z.number().min(0).max(6, "Invalid day of week"),
    openTime: TimeFormatSchema,
    closeTime: TimeFormatSchema,
  })
  .refine(
    (data) => {
      const [openHour, openMinute] = data.openTime.split(":").map(Number);
      const [closeHour, closeMinute] = data.closeTime.split(":").map(Number);
      const openTotal = openHour * 60 + openMinute;
      const closeTotal = closeHour * 60 + closeMinute;
      return closeTotal > openTotal;
    },
    { message: "Close time must be after open time" },
  );

export const CreateBranchSchema = z.object({
  name: z
    .string()
    .min(1, "Branch name is required")
    .min(2, "Name must be at least 2 characters"),
  spaId: z.string().min(1, "Spa is required").uuid("Invalid spa ID"),
  location: z.string().optional().nullable(),
  phone: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || /^[\+]?[0-9\s\-\(\)\.]+$/.test(val),
      "Invalid phone number format",
    ),
  email: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || z.string().email().safeParse(val).success,
      "Invalid email format",
    ),
  imageUrls: z.array(z.string()).optional().default([]),
  mediaIds: z.array(z.string()).optional().default([]),
  operatingHours: z.array(OperatingHourSchema).optional(),
});

export const UpdateBranchSchema = z.object({
  name: z
    .string()
    .min(1, "Branch name is required")
    .min(2, "Name must be at least 2 characters")
    .optional(),
  location: z.string().optional().nullable(),
  phone: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || /^[\+]?[0-9\s\-\(\)\.]+$/.test(val),
      "Invalid phone number format",
    ),
  email: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || z.string().email().safeParse(val).success,
      "Invalid email format",
    ),
  imageUrls: z.array(z.string()).optional().default([]),
  mediaIds: z.array(z.string()).optional().default([]),
  operatingHours: z
    .array(OperatingHourSchema)
    .min(1, "At least one operating hour is required"),
  maxConcurrentBookings: z
    .number()
    .int("Must be a whole number")
    .min(0, "Cannot be negative")
    .optional(),
  emailNotificationThreshold: z
    .number()
    .int("Must be a whole number")
    .min(0, "Cannot be negative")
    .optional()
    .nullable(),
});

export type CreateBranchFormData = z.infer<typeof CreateBranchSchema>;
export type UpdateBranchFormData = z.infer<typeof UpdateBranchSchema>;
export type OperatingHour = z.infer<typeof OperatingHourSchema>;
export const DAYS_OF_WEEK_CONST = DAYS_OF_WEEK;
