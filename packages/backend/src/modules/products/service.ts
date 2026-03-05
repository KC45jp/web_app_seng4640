import {
  listProductsResultSchema,
  getProductByIdResultSchema,
} from "./schema";
import type { GetProductByIdResult, ListProductsQuery, ListProductsResult } from "./schema";

export async function listProducts(_query: ListProductsQuery): Promise<ListProductsResult> {
  // TODO: implement products search/list.
  return listProductsResultSchema.parse({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
  });
}

export async function getProductById(_productId: string): Promise<GetProductByIdResult> {
  // TODO: implement product details.

  return getProductByIdResultSchema.parse({
    product: {
      _id: _productId,
      name: "TBD Product",
      description: "Not implemented yet",
      price: 0,
      category: "uncategorized",
      stock: 0,
      imageUrl: "/images/placeholder.jpg",
      isFlashSale: false,
      isActive: true,
    },
  });
}
