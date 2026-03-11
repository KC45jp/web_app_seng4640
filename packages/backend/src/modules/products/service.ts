import { isValidObjectId } from "mongoose";
import type { Logger } from "pino";
import type { InferSchemaType, QueryFilter, Require_id, SortOrder } from "mongoose";
import {
  listProductsResultSchema,
  getProductByIdResultSchema,
} from "./schema";
import type {
  GetProductByIdResult,
  ListProductsQuery,
  ListProductsResult,
  ProductDetail,
} from "./schema";
import { productModel, productSchema } from "@/db/models/product.models";
import { type Product } from "@seng4640/shared";
import { BadRequestError, NotFoundError } from "@/utils/errors";


/////////////// listProducts and its helpers //////////////////////////
type ProductDoc = Require_id<InferSchemaType<typeof productSchema>>;

const buildRange = (min?: number, max?: number) =>{
  if (min === undefined && max === undefined) return undefined;

  return {
    ...(min !== undefined ? { $gte: min } : {}),
    ...(max !== undefined ? { $lte: max } : {}),
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds the MongoDB filter used by `listProducts`.
 *
 * Returned filter shape:
 * - always includes `{ isActive: true }`
 * - optionally adds `category`
 * - optionally adds `price` with `$gte`/`$lte`
 * - optionally adds `$and`, where each element is a case-insensitive regex
 *   condition on `name`; when `$and` is present, every search word must match
 *
 * Example output:
 * `{ isActive: true, category: "book", $and: [{ name: { $regex: "foo", $options: "i" } }, { name: { $regex: "bar", $options: "i" } }] }`
 *
 * @param query Product list query params from the request.
 * @returns A MongoDB query filter for active products matching the requested search conditions.
 */
const buildProductListFilter = (query: ListProductsQuery):QueryFilter<ProductDoc>  => {

  const filter: Record<string, unknown> = {
    isActive: true,
  };

  const searchWord = query.q?.trim();

  if (searchWord){
    const words = searchWord.trim().split(/\s+/).filter(Boolean);
    if (words.length > 0) {
      filter.$and = words.map((word) => ({
        name: { $regex: escapeRegex(word), $options: "i" }
      }));
    }
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = buildRange(query.minPrice, query.maxPrice);
  }

  return filter;
}

function buildProductSort(query: ListProductsQuery): Record<string, SortOrder> {
  const sortOrder: SortOrder = query.sortOrder === "asc" ? 1 : -1;

  switch (query.sortBy) {
    case "price":
      return { price: sortOrder };
    case "name":
      return { name: sortOrder };
    case "createdAt":
      return { createdAt: sortOrder };
    case "relevance":
    default:
      return { createdAt: -1 };
  }
}
function serializeProduct(doc: ProductDoc): Product {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    price: doc.price,
    flashSalePrice: doc.flashSalePrice ?? null,
    category: doc.category,
    imageUrl: doc.imageUrl,
    isFlashSale: doc.isFlashSale,
    isActive: doc.isActive,
    createdAt: doc.createdAt?.toISOString(),
  };
}

export async function listProducts(
  _query: ListProductsQuery,
  requestLogger: Logger
): Promise<ListProductsResult> {
  requestLogger.debug({ query: _query }, "List products started");

  const page = _query.page ?? 1;
  const limit = _query.limit ?? 50;
  const skip = (page - 1) * limit;

  const filter = buildProductListFilter(_query);
  const sort = buildProductSort(_query);
  const items = await productModel.find(filter).sort(sort).skip(skip).limit(limit).lean<ProductDoc[]>();

  const total = await productModel.countDocuments(filter)

  requestLogger.debug(
    { page, limit, total, returnedItems: items.length },
    "List products completed"
  );

  return listProductsResultSchema.parse({
    items: items.map(serializeProduct),
    total: total,
    page: page,
    limit: limit,
  });
}





//////////////// getProductById and its helpers //////////////////////////

/**
 * Finds a single active product by id.
 *
 * @param productId Product id from the request path.
 * @returns The matched active product document, or `null` when not found.
 */
async function findActiveProductById(productId: string): Promise<ProductDoc | null> {
  return productModel
    .findOne({ _id: productId, isActive: true })
    .lean<ProductDoc | null>();
}

/**
 * Converts a product document into the detail response payload.
 *
 * @param doc Product document fetched from MongoDB.
 * @returns Serialized product detail data.
 */
function serializeProductDetail(doc: ProductDoc): ProductDetail {
  
  return {
    _id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    price: doc.price,
    flashSalePrice: doc.flashSalePrice ?? null,
    category: doc.category,
    imageUrl: doc.imageUrl,
    isFlashSale: doc.isFlashSale,
    isActive: doc.isActive,
    createdAt: doc.createdAt?.toISOString(),

    detailedDescription: doc.detailedDescription ?? null,
    stock: doc.stock,
    descriptionImages: doc.descriptionImages ?? [],
    flashSaleStartAt: doc.flashSaleStartAt?.toISOString() ?? null,
    flashSaleEndAt: doc.flashSaleEndAt?.toISOString() ?? null,
    productOwnerId: doc.productOwnerId?.toString() ?? null,
    updatedAt: doc.updatedAt?.toISOString(),
  };

}




export async function getProductById(
  _productId: string,
  requestLogger: Logger
): Promise<GetProductByIdResult> {
  requestLogger.debug({ productId: _productId }, "Get product by id started");
  if (!isValidObjectId(_productId)) {
    requestLogger.warn({ productId: _productId }, "Invalid product id");
    throw new BadRequestError("Invalid product id");
  }

  const product = await findActiveProductById(_productId);
  if (!product) {
    requestLogger.info({ productId: _productId }, "Product not found");
    throw new NotFoundError("Product not found");
  }

  requestLogger.debug({ productId: _productId }, "Get product by id completed");

  return getProductByIdResultSchema.parse({
    product: serializeProductDetail(product),
  });
}
