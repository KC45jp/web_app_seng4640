import { z } from "zod";
import { PRODUCT_CATEGORIES } from "@seng4640/shared";
import type {
  AdminCreateManagerInput,
  AdminCreateProductInput,
  AdminUpdateFlashSaleInput,
  AdminUpdateProductInput,
} from "@seng4640/shared";

const productCategorySchema = z.string().trim().pipe(z.enum(PRODUCT_CATEGORIES));

export const adminCreateProductSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  imageUrl: z.string().trim().min(1),
  category: productCategorySchema,
  isFlashSale: z.boolean().optional(),
}) satisfies z.ZodType<AdminCreateProductInput>;

export const adminUpdateProductSchema =
  adminCreateProductSchema.partial() satisfies z.ZodType<AdminUpdateProductInput>;

export const adminUpdateFlashSaleSchema = z.object({
  isFlashSale: z.boolean(),
  flashSaleStartAt: z.coerce.date().nullable().optional(),
  flashSaleEndAt: z.coerce.date().nullable().optional(),
  flashSalePrice: z.number().nonnegative().nullable().optional(),
}) satisfies z.ZodType<AdminUpdateFlashSaleInput>;

export const adminCreateManagerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8),
}) satisfies z.ZodType<AdminCreateManagerInput>;
