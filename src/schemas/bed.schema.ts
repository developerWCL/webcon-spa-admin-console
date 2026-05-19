import { z } from "zod";

export const bedTypeEnum = z.enum(["bed", "chair"]);

export const createBedSchema = z.object({
  name: z.string().min(1, "Bed name is required"),
  bedId: z.string().optional(),
  type: bedTypeEnum,
  roomId: z.string().optional(),
});

export type CreateBedFormData = z.infer<typeof createBedSchema>;
export type BedType = z.infer<typeof bedTypeEnum>;
