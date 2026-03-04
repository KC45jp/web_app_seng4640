import { z } from "zod";
import type { ListProductsQuery } from "@seng4640/shared";

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

export type { ListProductsQuery };
