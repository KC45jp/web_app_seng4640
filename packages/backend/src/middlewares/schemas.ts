import { z } from "zod";
import {
  UserRole,
  type AuthUser
} from "@seng4640/shared";

export const authTokenPayloadSchema = z.looseObject({
  id: z.string().min(1),
  role: z.enum([UserRole.CUSTOMER, UserRole.MANAGER, UserRole.ADMIN]),
}) satisfies z.ZodType<AuthUser>;
