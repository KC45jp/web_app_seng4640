import { z } from "zod";

export const adminCreateProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  imageUrl: z.string().min(1),
  category: z.string().min(1),
  isFlashSale: z.boolean().optional(),
});

export const adminUpdateProductSchema = adminCreateProductSchema.partial();

export const adminUpdateFlashSaleSchema = z.object({
  isFlashSale: z.boolean(),
  flashSaleStartAt: z.coerce.date().nullable().optional(),
  flashSaleEndAt: z.coerce.date().nullable().optional(),
  flashSalePrice: z.number().nonnegative().nullable().optional(),
});

export const adminCreateManagerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});
