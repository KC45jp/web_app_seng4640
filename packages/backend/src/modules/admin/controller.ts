import type { Request, Response } from "express";
import { notImplemented } from "../../utils/notImplemented";
import {
  adminCreateManagerSchema,
  adminCreateProductSchema,
  adminUpdateFlashSaleSchema,
  adminUpdateProductSchema,
} from "./schema";

export async function createProduct(req: Request, res: Response): Promise<void> {
  const parseResult = adminCreateProductSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ errors: parseResult.error.flatten() });
    return;
  }

  notImplemented(res, "POST /api/admin/products");
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  if (!req.params.id) {
    res.status(400).json({ message: "Product id is required" });
    return;
  }

  const parseResult = adminUpdateProductSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ errors: parseResult.error.flatten() });
    return;
  }

  notImplemented(res, "PATCH /api/admin/products/:id");
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  if (!req.params.id) {
    res.status(400).json({ message: "Product id is required" });
    return;
  }

  notImplemented(res, "DELETE /api/admin/products/:id");
}

export async function updateFlashSale(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.params.id) {
    res.status(400).json({ message: "Product id is required" });
    return;
  }

  const parseResult = adminUpdateFlashSaleSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ errors: parseResult.error.flatten() });
    return;
  }

  notImplemented(res, "PATCH /api/admin/products/:id/flash-sale");
}

export async function createManager(req: Request, res: Response): Promise<void> {
  const parseResult = adminCreateManagerSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ errors: parseResult.error.flatten() });
    return;
  }

  notImplemented(res, "POST /api/admin/managers");
}

export async function deleteManager(req: Request, res: Response): Promise<void> {
  if (!req.params.id) {
    res.status(400).json({ message: "Manager id is required" });
    return;
  }

  notImplemented(res, "DELETE /api/admin/managers/:id");
}

export async function listManagers(req: Request, res: Response): Promise<void> {
  notImplemented(res, "GET /api/admin/managers");
}
