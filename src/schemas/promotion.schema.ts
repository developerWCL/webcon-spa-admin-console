import { z } from "zod";

export const PromotionDiscountType = z.enum(["percentage", "fixed"]);
export const PromotionActiveDay = z.enum([
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
]);
export const EntityStatus = z.enum(["active", "inactive"]);
export const PromotionGuestType = z.enum(["all_guests", "authenticated_only"]);
export const ActiveDayWithTimeSchema = z.object({
  day: PromotionActiveDay,
  allDay: z.boolean().default(true),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

// Schema that handles both legacy string format and new object format
const ActiveDaysSchema = z
  .union([
    z.array(PromotionActiveDay), // Legacy: array of strings
    z.array(ActiveDayWithTimeSchema), // New: array of objects
  ])
  .transform((value) => {
    // Convert legacy string format to new format
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === "string"
    ) {
      return (value as string[]).map((day) => ({
        day: day as typeof PromotionActiveDay._type,
        allDay: true,
      }));
    }
    return value as z.infer<typeof ActiveDayWithTimeSchema>[];
  });
export const PromotionSchema = z.object({
  code: z.string().min(1, "Promotion code is required"),
  name: z.string().min(1, "Promotion name is required"),
  description: z.string().optional(),
  discountType: PromotionDiscountType,
  discountValue: z.string().min(1, "Discount value is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  minPurchaseAmount: z.string().min(1, "Minimum purchase amount is required"),
  maxUsed: z.number().int().min(0, "Maximum usage must be at least 0"),
  maxUsedPerAccount: z
    .number()
    .int()
    .min(0, "Maximum usage per account must be at least 0")
    .optional(),
  guestType: PromotionGuestType.optional(),
  activeDays: ActiveDaysSchema,
  branchId: z.string().optional(),
  status: EntityStatus.optional(),
  imageUrls: z.array(z.string()).optional(),
  mediaIds: z.array(z.string()).optional(),
  serviceIds: z.array(z.string()).optional(),
  packageIds: z.array(z.string()).optional(),
  programmeIds: z.array(z.string()).optional(),
});
export const UpdatePromotionSchema = PromotionSchema.partial();

export type ActiveDayWithTime = z.infer<typeof ActiveDayWithTimeSchema>;
export type PromotionFormData = z.infer<typeof PromotionSchema>;
export type UpdatePromotionFormData = z.infer<typeof UpdatePromotionSchema>;
