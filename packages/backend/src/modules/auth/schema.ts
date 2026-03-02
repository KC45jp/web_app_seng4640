import { z } from "zod";
import { UserRole } from "@seng4640/shared";

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});


const userRoleSchema = z.enum([
  UserRole.GUEST,
  UserRole.CUSTOMER,
  UserRole.MANAGER,
  UserRole.ADMIN,
]);

export const registerResultSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: userRoleSchema,
  }),
  accessToken: z.string(),
});

export const loginResultSchema = registerResultSchema;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterResult = z.infer<typeof registerResultSchema>;
export type LoginResult = z.infer<typeof loginResultSchema>;
