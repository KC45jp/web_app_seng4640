import type { Request, Response } from "express";
import { notImplemented } from "../../utils/notImplemented";
import { addCartItemSchema, updateCartItemSchema } from "./schema";
import { validateOrRespond } from "../../utils/validation";

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

  if (
    validateOrRespond(addCartItemSchema, req.body, res, "POST /api/cart/items") ===
    null
  ) {
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

  if (
    validateOrRespond(
      updateCartItemSchema,
      req.body,
      res,
      "PATCH /api/cart/items/:productId"
    ) === null
  ) {
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
