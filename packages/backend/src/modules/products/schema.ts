import { z } from "zod";
import { PRODUCT_CATEGORIES } from "@seng4640/shared";
import type {
  GetProductByIdResult,
  ListProductsQuery,
  ListProductsResult,
  Product,
  ProductDetail,
} from "@seng4640/shared";

const productCategorySchema = z.string().trim().pipe(z.enum(PRODUCT_CATEGORIES));

export const listProductsQuerySchema = z.object({
  q: z.string().optional(),
  category: productCategorySchema.optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sortBy: z.enum(["relevance", "price", "createdAt", "name"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
}) satisfies z.ZodType<ListProductsQuery>;

export const productSummarySchema = z.object({
  _id: z.string().min(1).optional(),
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().nonnegative(),
  flashSalePrice: z.number().nonnegative().nullable().optional(),
  category: productCategorySchema,
  imageUrl: z.string().min(1),
  isFlashSale: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().optional(),
}) satisfies z.ZodType<Product>;

export const productDetailSchema = productSummarySchema.extend({
  detailedDescription: z.string().nullable().optional(),
  stock: z.number().int().nonnegative(),
  descriptionImages: z.array(z.string()).optional(),
  flashSaleStartAt: z.string().nullable().optional(),
  flashSaleEndAt: z.string().nullable().optional(),
  productOwnerId: z.string().nullable().optional(),
  updatedAt: z.string().optional(),
}) satisfies z.ZodType<ProductDetail>;

export const listProductsResultSchema = z.object({
  items: z.array(productSummarySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
}) satisfies z.ZodType<ListProductsResult>;

export const getProductByIdResultSchema = z.object({
  product: productDetailSchema,
}) satisfies z.ZodType<GetProductByIdResult>;

export type {
  GetProductByIdResult,
  ListProductsQuery,
  ListProductsResult,
  Product,
  ProductDetail,
};
