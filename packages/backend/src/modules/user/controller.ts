import type { Request, Response } from "express";
import { notImplemented } from "../../utils/notImplemented";
import { updateMeSchema } from "./schema";
import { validateOrRespond } from "../../utils/validation";

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

  if (
    validateOrRespond(updateMeSchema, req.body, res, "PATCH /api/me") === null
  ) {
    return;
  }

  notImplemented(res, "PATCH /api/me");
}
