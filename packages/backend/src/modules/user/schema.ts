import { z } from "zod";
import type { UpdateMeInput } from "@seng4640/shared";

export const updateMeSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
}) satisfies z.ZodType<UpdateMeInput>;

export type { UpdateMeInput };
