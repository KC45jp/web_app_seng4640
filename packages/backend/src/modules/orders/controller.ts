import type { Request, Response } from "express";
import { notImplemented } from "../../utils/notImplemented";

export async function listOrders(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  notImplemented(res, "GET /api/orders");
}

export async function getOrderById(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!req.params.id) {
    res.status(400).json({ message: "Order id is required" });
    return;
  }

  notImplemented(res, "GET /api/orders/:id");
}
