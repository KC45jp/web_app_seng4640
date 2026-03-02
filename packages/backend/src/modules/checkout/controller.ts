import type { Request, Response } from "express";
import { notImplemented } from "../../utils/notImplemented";
import { checkoutSchema } from "./schema";

export async function checkout(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const parseResult = checkoutSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ errors: parseResult.error.flatten() });
    return;
  }

  notImplemented(res, "POST /api/checkout");
}
