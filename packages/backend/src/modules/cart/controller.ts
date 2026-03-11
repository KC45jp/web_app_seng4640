import type { Request, Response } from "express";
import { notImplemented } from "../../utils/notImplemented";
import { addCartItemSchema, updateCartItemSchema } from "./schema";
import { validateOrRespond } from "../../utils/validation";
import { getRequestLogger } from "@/utils/requestLogger";
import { handleControllerError } from "@/utils/controllerError";

import {
  addItemToCart,
  getCartByUserId,
  updateCartItemQuantity,
  removeItemFromCart
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
    handleControllerError({
      error,
      res,
      logger: cartControllerLogger,
      route: "GET /api/cart",
      failureMessage: "Get cart request failed",
      unexpectedMessage: "Unexpected error while handling get cart request",
      context: { userId: req.user.id },
    });
  }
}

export async function addCartItem(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const cartControllerLogger = requestLogger.child({ module: "cart-controller" });
  const cartServiceLogger = requestLogger.child({ module: "cart-service" });
  if (!req.user) {
    cartControllerLogger.warn({ route: "POST /api/cart/items" }, "Unauthorized cart request");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  cartControllerLogger.debug(
    { route: "POST /api/cart/items", userId: req.user.id, productId: req.body?.productId },
    "Add cart item request received"
  );

  const input = validateOrRespond(addCartItemSchema, req.body, res, "POST /api/cart/items");
  if (input===null) {
    cartControllerLogger.debug(
      { route: "POST /api/cart/items", userId: req.user.id },
      "Add cart item request rejected due to invalid input"
    );
    return;
  }
  try{
    const updatedCart = await addItemToCart(req.user.id, input, cartServiceLogger);
    res.status(200).json(updatedCart);
  }
  catch(error){
    handleControllerError({
      error,
      res,
      logger: cartControllerLogger,
      route: "POST /api/cart/items",
      failureMessage: "POST cart request failed",
      unexpectedMessage: "Unexpected error while handling post cart request",
      context: { userId: req.user.id },
    });
  }
}

export async function updateCartItem(
  req: Request,
  res: Response
): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const cartControllerLogger = requestLogger.child({ module: "cart-controller" });
  const cartServiceLogger = requestLogger.child({ module: "cart-service" });
  const productId = Array.isArray(req.params.productId)
    ? req.params.productId[0]
    : req.params.productId;
  if (!req.user) {
    cartControllerLogger.warn({ route: "PATCH /api/cart/items/:productId" }, "Unauthorized cart request");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  cartControllerLogger.debug(
    {
      route: "PATCH /api/cart/items/:productId",
      userId: req.user.id,
      productId,
    },
    "Update cart item request received"
  );
  if (!productId) {
    cartControllerLogger.warn(
      { route: "PATCH /api/cart/items/:productId", userId: req.user.id },
      "Update cart item request failed because product id was missing"
    );
    res.status(400).json({ message: "productId is required" });
    return;
  }

  const input = validateOrRespond(
      updateCartItemSchema,
      req.body,
      res,
      "PATCH /api/cart/items/:productId"
    )
  if (input === null) {
    cartControllerLogger.debug(
      {
        route: "PATCH /api/cart/items/:productId",
        userId: req.user.id,
        productId,
      },
      "Update cart item request rejected due to invalid input"
    );
    return;
  }

  try{
    const updatedCart = await updateCartItemQuantity(req.user.id, productId, input, cartServiceLogger);
    res.status(200).json(updatedCart);
  }catch(error){
    handleControllerError({
      error,
      res,
      logger: cartControllerLogger,
      route: "PATCH /api/cart/items/:productId",
      failureMessage: "PATCH cart request failed",
      unexpectedMessage: "Unexpected error while handling patch cart request",
      context: { userId: req.user.id, productId },
    });
  }
}

export async function removeCartItem(
  req: Request,
  res: Response
): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const cartControllerLogger = requestLogger.child({ module: "cart-controller" });
  const cartServiceLogger = requestLogger.child({ module: "cart-service" });
  const productId = Array.isArray(req.params.productId)
    ? req.params.productId[0]
    : req.params.productId;
  if (!req.user) {
    cartControllerLogger.warn({ route: "DELETE /api/cart/items/:productId" }, "Unauthorized cart request");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  cartControllerLogger.debug(
    {
      route: "DELETE /api/cart/items/:productId",
      userId: req.user.id,
      productId,
    },
    "Remove cart item request received"
  );
  if (!productId) {
    cartControllerLogger.warn(
      { route: "DELETE /api/cart/items/:productId", userId: req.user.id },
      "Remove cart item request failed because product id was missing"
    );
    res.status(400).json({ message: "productId is required" });
    return;
  }

  try{
    const updatedCart = await removeItemFromCart(req.user.id, productId, cartServiceLogger);
    res.status(200).json(updatedCart);
  }catch(error){
    handleControllerError({
      error,
      res,
      logger: cartControllerLogger,
      route: "DELETE /api/cart/items/:productId",
      failureMessage: "DELETE cart request failed",
      unexpectedMessage: "Unexpected error while handling delete cart request",
      context: { userId: req.user.id, productId },
    });
  }
}
