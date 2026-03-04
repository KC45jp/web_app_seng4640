import { z } from "zod";
import type { AddCartItemInput, UpdateCartItemInput } from "@seng4640/shared";

export const addCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
}) satisfies z.ZodType<AddCartItemInput>;

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
}) satisfies z.ZodType<UpdateCartItemInput>;

export type { AddCartItemInput, UpdateCartItemInput };
