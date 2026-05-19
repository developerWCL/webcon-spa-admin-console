import z from "zod";

export const translationSchema = z.object({
  languageCode: z.string(),
  name: z.string(),
  description: z.string().nullable().optional().default(""),
});

export const stepTranslationSchema = z.object({
  languageCode: z.string(),
  title: z.string(),
  description: z.string().nullable().optional().default(""),
});

export const programmeStepSchema = z.object({
  id: z.number().or(z.string()),
  title: z.string().optional().default(""),
  description: z.string().optional().default(""),
  duration: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .refine((val) => val.trim().length > 0, "Duration is required"),
  translations: z.array(stepTranslationSchema).refine(
    (translations) => {
      // At least one language must have a title
      return translations.some((t) => t.title.trim().length > 0);
    },
    { message: "At least one language must have title" },
  ),
});

export const programmeFormSchema = z.object({
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => !isNaN(parseFloat(val)), "Price must be a valid number")
    .refine((val) => parseFloat(val) > 0, "Price must be greater than 0"),
  status: z.enum(["active", "inactive"]),
  maxConcurrentBookings: z
    .string()
    .min(1, "Maximum concurrent bookings is required")
    .refine(
      (val) => !val || (!isNaN(parseInt(val)) && parseInt(val) >= 0),
      "Maximum concurrent bookings must be a non-negative number",
    ),
  maxBookingsPerDay: z
    .string()
    .min(1, "Maximum bookings per day is required")
    .refine(
      (val) => !val || (!isNaN(parseInt(val)) && parseInt(val) >= 0),
      "Maximum bookings per day must be a non-negative number",
    ),
  imageUrls: z.array(z.string()).max(8, "Maximum 8 images allowed"),
  translations: z
    .array(translationSchema)
    .min(1, "At least one translation is required")
    .refine(
      (translations) => {
        const primaryTranslation = translations.find(
          (t) => t.languageCode === "en", // Assuming primary is English
        );
        return primaryTranslation && primaryTranslation.name.trim().length > 0;
      },
      {
        message: "Primary language (English) name is required",
      },
    ),
});

export type ProgrammeFormData = z.infer<typeof programmeFormSchema>;
export type ProgrammeStep = z.infer<typeof programmeStepSchema>;
