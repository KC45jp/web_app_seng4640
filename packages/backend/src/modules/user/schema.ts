import { z } from "zod";
import type { UpdateMeInput } from "@seng4640/shared";

export const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
}) satisfies z.ZodType<UpdateMeInput>;

export type { UpdateMeInput };
