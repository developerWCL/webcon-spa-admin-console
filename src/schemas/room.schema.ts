import { z } from "zod";

export const roomStatusEnum = z.enum([
  "available",
  "occupied",
  "maintenance",
  "cleaning",
]);

export const createRoomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  type: z.string().optional(),
  capacity: z.coerce
    .number()
    .int("Capacity must be a whole number")
    .min(0, "Capacity must be at least 0")
    .max(50, "Capacity cannot exceed 50")
    .nullable()
    .default(null),
  floor: z.string().optional(),
  size: z.string().optional(),
  status: roomStatusEnum.optional(),
});

export type CreateRoomFormData = z.infer<typeof createRoomSchema>;
export type RoomStatus = z.infer<typeof roomStatusEnum>;
