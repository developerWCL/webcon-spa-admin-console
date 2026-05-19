import { z } from "zod";

export const dayOffReasonEnum = z.enum([
  "sick_leave",
  "personal",
  "vacation",
  "medical_appointment",
  "family_emergency",
  "other",
]);

export const staffDayOffSchema = z.object({
  date: z.string().min(1, "Date is required"),
  staffId: z.string().min(1, "Staff member is required"),
  reason: dayOffReasonEnum,
  status: z.enum(["pending", "approved", "rejected"], {
    errorMap: () => ({ message: "Status is required" }),
  }),
  note: z.string().optional(),
});

export type StaffDayOffFormData = z.infer<typeof staffDayOffSchema>;
