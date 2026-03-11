import type { Request, Response } from "express";
import { notImplemented } from "../../utils/notImplemented";
import { getRequestLogger } from "@/utils/requestLogger";

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
  notImplemented(res, "GET /api/orders");
}

export async function getOrderById(
  req: Request,
  res: Response
): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const ordersControllerLogger = requestLogger.child({ module: "orders-controller" });
  if (!req.user) {
    ordersControllerLogger.warn(
      { route: "GET /api/orders/:id" },
      "Unauthorized orders request"
    );
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  ordersControllerLogger.debug(
    { route: "GET /api/orders/:id", userId: req.user.id, orderId: req.params.id },
    "Get order by id request received"
  );
  if (!req.params.id) {
    ordersControllerLogger.warn(
      { route: "GET /api/orders/:id", userId: req.user.id },
      "Get order by id request failed because order id was missing"
    );
    res.status(400).json({ message: "Order id is required" });
    return;
  }

  notImplemented(res, "GET /api/orders/:id");
}
