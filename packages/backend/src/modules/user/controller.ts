import type { Request, Response } from "express";
import { notImplemented } from "../../utils/notImplemented";
import { updateMeSchema } from "./schema";

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  notImplemented(res, "GET /api/me");
}

export async function patchMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const parseResult = updateMeSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ errors: parseResult.error.flatten() });
    return;
  }

  notImplemented(res, "PATCH /api/me");
}
