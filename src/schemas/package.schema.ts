import { z } from "zod";

export const PackageTranslationSchema = z.object({
  languageCode: z.string().min(1, "Language code is required"),
  name: z.string().optional(),
  description: z.string().optional(),
});

export const SubServiceTranslationSchema = z.object({
  languageCode: z.string().min(1, "Language code is required"),
  name: z.string().optional(),
  description: z.string().optional(),
});

export const CreateNewSubServiceSchema = z.object({
  serviceId: z.string().uuid("Invalid service ID"),
  name: z.string().min(1, "Sub-service name is required"),
  durationMinutes: z.string().optional(),
  price: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  translations: z.array(SubServiceTranslationSchema).optional().default([]),
});

const BasePackageSchema = z.object({
  branchIds: z
    .array(z.string().min(1))
    .min(1, "At least one branch is required")
    .optional(),
  name: z.string().min(1, "Package name is required"),
  description: z.string().min(1, "Package description is required"),
  price: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  status: z.enum(["active", "inactive"]).default("active"),
  subServiceIds: z
    .array(z.string().uuid("Invalid sub-service ID"))
    .optional()
    .default([]),
  newSubServices: z.array(CreateNewSubServiceSchema).optional().default([]),
  translations: z.array(PackageTranslationSchema).optional().default([]),
  mediaIds: z.array(z.string().uuid("Invalid media ID")).optional().default([]),
});

export const CreatePackageSchema = BasePackageSchema.refine(
  (data) => data.subServiceIds.length + data.newSubServices.length >= 1,
  {
    message: "Package must have at least 1 sub-service",
    path: ["subServiceIds"],
  },
).superRefine((data, ctx) => {
  if (data.newSubServices.length > 0) {
    data.newSubServices.forEach((subService, index) => {
      // Check if price is missing or just empty whitespace
      if (!subService.price || subService.price.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Price is required when creating new sub-services",
          // This dynamically points to newSubServices[index].price
          path: ["newSubServices", index, "price"],
        });
      }
    });
  }
});

export const UpdatePackageSchema = BasePackageSchema.partial().refine(
  (data) => {
    // Only validate sub-services count if at least one is provided
    if (data.subServiceIds || data.newSubServices) {
      const totalCount =
        (data.subServiceIds?.length || 0) + (data.newSubServices?.length || 0);
      return totalCount >= 1 && totalCount <= 10;
    }
    return true;
  },
  {
    message: "Package must have at least 1 and at most 10 sub-services",
    path: ["subServiceIds"],
  },
);

export type CreatePackageFormValues = z.infer<typeof CreatePackageSchema>;
export type UpdatePackageFormValues = z.infer<typeof UpdatePackageSchema>;
export type PackageTranslation = z.infer<typeof PackageTranslationSchema>;
export type SubServiceTranslation = z.infer<typeof SubServiceTranslationSchema>;
export type CreateNewSubService = z.infer<typeof CreateNewSubServiceSchema>;
