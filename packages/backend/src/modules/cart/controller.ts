import type { Request, Response } from "express";
import { notImplemented } from "../../utils/notImplemented";
import { addCartItemSchema, updateCartItemSchema } from "./schema";
import { validateOrRespond } from "../../utils/validation";
import { AppError } from "@/utils/errors";
import { getRequestLogger } from "@/utils/requestLogger";

import {
  getCartByUserId,
} from "./service";

export async function getCart(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const cartControllerLogger = requestLogger.child({ module: "cart-controller" });
  const cartServiceLogger = requestLogger.child({ module: "cart-service" });
  if (!req.user) {
    cartControllerLogger.warn({ route: "GET /api/cart" }, "Unauthorized cart request");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  cartControllerLogger.debug(
    { route: "GET /api/cart", userId: req.user.id },
    "Get cart request received"
  );

  try {
    const result = await getCartByUserId(req.user.id, cartServiceLogger);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      cartControllerLogger.warn(
        {
          route: "GET /api/cart",
          status: error.status,
          error: error.message,
          userId: req.user.id,
        },
        "Get cart request failed"
      );
      res.status(error.status).json({ message: error.message });
      return;
    }

    cartControllerLogger.error(
      { err: error, route: "GET /api/cart", userId: req.user.id },
      "Unexpected error while handling get cart request"
    );
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function addCartItem(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const cartControllerLogger = requestLogger.child({ module: "cart-controller" });
  if (!req.user) {
    cartControllerLogger.warn({ route: "POST /api/cart/items" }, "Unauthorized cart request");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  cartControllerLogger.debug(
    { route: "POST /api/cart/items", userId: req.user.id, productId: req.body?.productId },
    "Add cart item request received"
  );
  if (
    validateOrRespond(addCartItemSchema, req.body, res, "POST /api/cart/items") ===
    null
  ) {
    cartControllerLogger.debug(
      { route: "POST /api/cart/items", userId: req.user.id },
      "Add cart item request rejected due to invalid input"
    );
    return;
  }

  notImplemented(res, "POST /api/cart/items");
}

export async function updateCartItem(
  req: Request,
  res: Response
): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const cartControllerLogger = requestLogger.child({ module: "cart-controller" });
  if (!req.user) {
    cartControllerLogger.warn({ route: "PATCH /api/cart/items/:productId" }, "Unauthorized cart request");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  cartControllerLogger.debug(
    {
      route: "PATCH /api/cart/items/:productId",
      userId: req.user.id,
      productId: req.params.productId,
    },
    "Update cart item request received"
  );
  if (!req.params.productId) {
    cartControllerLogger.warn(
      { route: "PATCH /api/cart/items/:productId", userId: req.user.id },
      "Update cart item request failed because product id was missing"
    );
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
    cartControllerLogger.debug(
      {
        route: "PATCH /api/cart/items/:productId",
        userId: req.user.id,
        productId: req.params.productId,
      },
      "Update cart item request rejected due to invalid input"
    );
    return;
  }

  notImplemented(res, "PATCH /api/cart/items/:productId");
}

export async function removeCartItem(
  req: Request,
  res: Response
): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const cartControllerLogger = requestLogger.child({ module: "cart-controller" });
  if (!req.user) {
    cartControllerLogger.warn({ route: "DELETE /api/cart/items/:productId" }, "Unauthorized cart request");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  cartControllerLogger.debug(
    {
      route: "DELETE /api/cart/items/:productId",
      userId: req.user.id,
      productId: req.params.productId,
    },
    "Remove cart item request received"
  );
  if (!req.params.productId) {
    cartControllerLogger.warn(
      { route: "DELETE /api/cart/items/:productId", userId: req.user.id },
      "Remove cart item request failed because product id was missing"
    );
    res.status(400).json({ message: "productId is required" });
    return;
  }

  notImplemented(res, "DELETE /api/cart/items/:productId");
}
