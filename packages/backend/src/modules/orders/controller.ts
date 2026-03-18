import type { Request, Response } from "express";
import { getRequestLogger } from "@/utils/requestLogger";
import { handleControllerError } from "@/utils/controllerError";
import {
  getOrderById as getOrderByIdService,
  listOrders as listOrdersService,
} from "./service";

export async function listOrders(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const ordersControllerLogger = requestLogger.child({ module: "orders-controller" });
  if (!req.user) {
    ordersControllerLogger.warn(
      { route: "GET /api/orders" },
      "Unauthorized orders request"
    );
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  ordersControllerLogger.debug(
    { route: "GET /api/orders", userId: req.user.id },
    "List orders request received"
  );

  try {
    const result = await listOrdersService(
      req.user.id,
      requestLogger.child({ module: "orders-service" })
    );
    res.status(200).json(result);
  } catch (error) {
    handleControllerError({
      error,
      res,
      logger: ordersControllerLogger,
      route: "GET /api/orders",
      failureMessage: "List orders request failed",
      unexpectedMessage: "Unexpected error while handling list orders request",
      context: { userId: req.user.id },
    });
  }
}

export async function getOrderById(
  req: Request,
  res: Response
): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const ordersControllerLogger = requestLogger.child({ module: "orders-controller" });
  const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!req.user) {
    ordersControllerLogger.warn(
      { route: "GET /api/orders/:id" },
      "Unauthorized orders request"
    );
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  ordersControllerLogger.debug(
    { route: "GET /api/orders/:id", userId: req.user.id, orderId },
    "Get order by id request received"
  );
  if (!orderId) {
    ordersControllerLogger.warn(
      { route: "GET /api/orders/:id", userId: req.user.id },
      "Get order by id request failed because order id was missing"
    );
    res.status(400).json({ message: "Order id is required" });
    return;
  }

  try {
    const result = await getOrderByIdService(
      req.user.id,
      orderId,
      requestLogger.child({ module: "orders-service" })
    );
    res.status(200).json(result);
  } catch (error) {
    handleControllerError({
      error,
      res,
      logger: ordersControllerLogger,
      route: "GET /api/orders/:id",
      failureMessage: "Get order by id request failed",
      unexpectedMessage: "Unexpected error while handling get order by id request",
      context: { userId: req.user.id, orderId },
    });
  }
}
