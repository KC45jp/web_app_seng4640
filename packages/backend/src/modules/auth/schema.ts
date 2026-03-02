import { z } from "zod";
import {
  UserRole,
  type LoginInput,
  type LoginResult,
  type RegisterInput,
  type RegisterResult,
} from "@seng4640/shared";

export const registerSchema: z.ZodType<RegisterInput> = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema: z.ZodType<LoginInput> = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});


const userRoleSchema = z.enum([
  UserRole.GUEST,
  UserRole.CUSTOMER,
  UserRole.MANAGER,
  UserRole.ADMIN,
]);

export const registerResultSchema: z.ZodType<RegisterResult> = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: userRoleSchema,
  }),
  accessToken: z.string(),
});

export const loginResultSchema: z.ZodType<LoginResult> = registerResultSchema;
