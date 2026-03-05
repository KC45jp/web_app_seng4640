import { z } from "zod";
import type {
  GetProductByIdResult,
  ListProductsQuery,
  ListProductsResult,
  Product,
} from "@seng4640/shared";

export const listProductsQuerySchema = z.object({
  q: z.string().optional(),
  search: z.string().optional(),
  str: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sortBy: z.enum(["relevance", "price", "createdAt", "name"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
}) satisfies z.ZodType<ListProductsQuery>;

export const productSchema = z.object({
  _id: z.string().min(1).optional(),
  name: z.string().min(1),
  description: z.string().min(1),
  detailedDescription: z.string().nullable().optional(),
  price: z.number().nonnegative(),
  flashSalePrice: z.number().nonnegative().nullable().optional(),
  category: z.string().min(1),
  stock: z.number().int().nonnegative(),
  imageUrl: z.string().min(1),
  descriptionImages: z.array(z.string()).optional(),
  isFlashSale: z.boolean(),
  flashSaleStartAt: z.string().nullable().optional(),
  flashSaleEndAt: z.string().nullable().optional(),
  isActive: z.boolean(),
  productOwnerId: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}) satisfies z.ZodType<Product>;

export const listProductsResultSchema = z.object({
  items: z.array(productSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
}) satisfies z.ZodType<ListProductsResult>;

export const getProductByIdResultSchema = z.object({
  product: productSchema,
}) satisfies z.ZodType<GetProductByIdResult>;

export type {
  GetProductByIdResult,
  ListProductsQuery,
  ListProductsResult,
  Product,
};
