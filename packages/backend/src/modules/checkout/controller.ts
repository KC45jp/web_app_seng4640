import type { Request, Response } from "express";
import { notImplemented } from "../../utils/notImplemented";
import { checkoutSchema } from "./schema";
import { validateOrRespond } from "../../utils/validation";

export async function checkout(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (validateOrRespond(checkoutSchema, req.body, res, "POST /api/checkout") === null) {
    return;
  }

  notImplemented(res, "POST /api/checkout");
}
