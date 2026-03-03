import type { Request, Response } from "express";
import { notImplemented } from "../../utils/notImplemented";
import { listProductsQuerySchema } from "./schema";
import { validateOrRespond } from "../../utils/validation";

export async function listProducts(req: Request, res: Response): Promise<void> {
  if (
    validateOrRespond(listProductsQuerySchema, req.query, res, "GET /api/products") ===
    null
  ) {
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
