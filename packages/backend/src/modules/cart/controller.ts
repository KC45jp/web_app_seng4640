import type { Request, Response } from "express";
import { notImplemented } from "../../utils/notImplemented";
import { addCartItemSchema, updateCartItemSchema } from "./schema";

export async function getCart(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  notImplemented(res, "GET /api/cart");
}

export async function addCartItem(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const parseResult = addCartItemSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ errors: parseResult.error.flatten() });
    return;
  }

  notImplemented(res, "POST /api/cart/items");
}

export async function updateCartItem(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!req.params.productId) {
    res.status(400).json({ message: "productId is required" });
    return;
  }

  const parseResult = updateCartItemSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ errors: parseResult.error.flatten() });
    return;
  }

  notImplemented(res, "PATCH /api/cart/items/:productId");
}

export async function removeCartItem(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!req.params.productId) {
    res.status(400).json({ message: "productId is required" });
    return;
  }

  notImplemented(res, "DELETE /api/cart/items/:productId");
}
