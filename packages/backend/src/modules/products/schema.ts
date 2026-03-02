import { z } from "zod";

export const listProductsQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
});

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
