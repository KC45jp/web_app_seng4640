import type { Request, Response } from "express";
import { listProductsQuerySchema } from "./schema";
import { validateOrRespond } from "../../utils/validation";
import {
  listProducts as listProductsService,
  getProductById as getProductByIdService,
} from "./service";
import { AppError } from "@/utils/errors";
import { getRequestLogger } from "@/utils/requestLogger";

export async function listProducts(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const productControllerLogger = requestLogger.child({ module: "product-controller" });
  const productServiceLogger = requestLogger.child({ module: "product-service" });
  const query = validateOrRespond(
    listProductsQuerySchema,
    req.query,
    res,
    "GET /api/products"
  );
  productControllerLogger.debug(
    { route: "GET /api/products", query: req.query },
    "List products request received"
  );
  if (!query) {
    productControllerLogger.debug(
      { route: "GET /api/products" },
      "List products request rejected due to invalid query"
    );
    return;
  }

  try {
    const data = await listProductsService(query, productServiceLogger);
    res.status(200).json(data);
  } catch (error) {
    if (error instanceof AppError) {
      productControllerLogger.warn(
        {
          route: "GET /api/products",
          status: error.status,
          error: error.message,
        },
        "List products request failed"
      );
      res.status(error.status).json({ message: error.message });
      return;
    }

    productControllerLogger.error(
      { err: error, route: "GET /api/products" },
      "Unexpected error while handling list products request"
    );
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getProductById(
  req: Request,
  res: Response
): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const productControllerLogger = requestLogger.child({ module: "product-controller" });
  const productServiceLogger = requestLogger.child({ module: "product-service" });
  const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  productControllerLogger.debug(
    { route: "GET /api/products/:id", productId },
    "Get product by id request received"
  );
  if (!productId) {
    productControllerLogger.warn(
      { route: "GET /api/products/:id" },
      "Get product by id request failed because product id was missing"
    );
    res.status(400).json({ message: "Product id is required" });
    return;
  }

  try {
    const data = await getProductByIdService(productId, productServiceLogger);
    res.status(200).json(data);
  } catch (error) {
    if (error instanceof AppError) {
      productControllerLogger.warn(
        {
          route: "GET /api/products/:id",
          status: error.status,
          error: error.message,
          productId,
        },
        "Get product by id request failed"
      );
      res.status(error.status).json({ message: error.message });
      return;
    }

    productControllerLogger.error(
      { err: error, route: "GET /api/products/:id", productId },
      "Unexpected error while handling get product by id request"
    );
    res.status(500).json({ message: "Internal server error" });
  }
}
