import type { Request, Response } from "express";
import { notImplemented } from "../../utils/notImplemented";
import { listProductsQuerySchema } from "./schema";

export async function listProducts(req: Request, res: Response): Promise<void> {
  const parseResult = listProductsQuerySchema.safeParse(req.query);
  if (!parseResult.success) {
    res.status(400).json({ errors: parseResult.error.flatten() });
    return;
  }

  notImplemented(res, "GET /api/products");
}

export async function getProductById(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.params.id) {
    res.status(400).json({ message: "Product id is required" });
    return;
  }

  notImplemented(res, "GET /api/products/:id");
}
