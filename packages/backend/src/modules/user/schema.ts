import { z } from "zod";

export const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
