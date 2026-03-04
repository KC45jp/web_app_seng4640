import type { Request, Response } from "express";
import { notImplemented } from "../../utils/notImplemented";
import {
  adminCreateManagerSchema,
  adminCreateProductSchema,
  adminUpdateFlashSaleSchema,
  adminUpdateProductSchema,
} from "./schema";
import { validateOrRespond } from "../../utils/validation";

export async function listManagedProducts(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  notImplemented(res, "GET /api/admin/products");
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  if (
    validateOrRespond(
      adminCreateProductSchema,
      req.body,
      res,
      "POST /api/admin/products"
    ) === null
  ) {
    return;
  }

  notImplemented(res, "POST /api/admin/products");
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  if (!req.params.id) {
    res.status(400).json({ message: "Product id is required" });
    return;
  }

  if (
    validateOrRespond(
      adminUpdateProductSchema,
      req.body,
      res,
      "PATCH /api/admin/products/:id"
    ) === null
  ) {
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

  if (
    validateOrRespond(
      adminUpdateFlashSaleSchema,
      req.body,
      res,
      "PATCH /api/admin/products/:id/flash-sale"
    ) === null
  ) {
    return;
  }

  notImplemented(res, "PATCH /api/admin/products/:id/flash-sale");
}

export async function createManager(req: Request, res: Response): Promise<void> {
  if (
    validateOrRespond(
      adminCreateManagerSchema,
      req.body,
      res,
      "POST /api/admin/managers"
    ) === null
  ) {
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
