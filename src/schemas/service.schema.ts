import { z } from "zod";

export const ServiceVariantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Variant name is required"),
  durationMinutes: z.number().min(1, "Duration must be at least 1 minute"),
  price: z.number().min(0, "Price must be a positive number"),
  status: z.enum(["active", "inactive"]),
  translations: z
    .array(
      z.object({
        languageCode: z.string().min(1, "Language code is required"),
        name: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
      }),
    )
    .optional()
    .default([]),
});

export const ServiceTranslationSchema = z.object({
  languageCode: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
});

export const CreateServiceSchema = z.object({
  branchId: z.union([
    z.string().min(1, "Branch is required"),
    z.array(z.string().min(1)).min(1, "At least one branch is required"),
  ]),
  categoryId: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  maxConcurrentBookings: z.number().min(0).default(1),
  maxBookingsPerDay: z.number().min(0).default(10),
  translations: z.array(ServiceTranslationSchema),
  subServices: z.array(ServiceVariantSchema).optional().default([]),
  imageUrls: z.array(z.string()).optional().default([]),
  mediaIds: z.array(z.string()).optional().default([]),
  isOverride: z.boolean().default(false),
});

export type CreateServiceFormData = z.infer<typeof CreateServiceSchema>;
export type ServiceVariant = z.infer<typeof ServiceVariantSchema>;
export type ServiceTranslation = z.infer<typeof ServiceTranslationSchema>;
