import type { Request, Response } from "express";
import { listProductsQuerySchema } from "./schema";
import { validateOrRespond } from "../../utils/validation";
import {
  listProducts as listProductsService,
  getProductById as getProductByIdService,
} from "./service";
import {AppError} from "@/utils/errors"

export async function listProducts(req: Request, res: Response): Promise<void> {
  const query = validateOrRespond(
    listProductsQuerySchema,
    req.query,
    res,
    "GET /api/products"
  );
  if (!query) return;

  const data = await listProductsService(query);
  res.status(200).json(data);
}

export async function getProductById(
  req: Request,
  res: Response
): Promise<void> {
  const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!productId) {
    res.status(400).json({ message: "Product id is required" });
    return;
  }

  try {
    const data = await getProductByIdService(productId);
    res.status(200).json(data);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({ message: error.message });
      return;
    }

    res.status(500).json({ message: "Internal server error" });
  }
}