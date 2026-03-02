import type { Request, Response } from "express";
import { notImplemented } from "../../utils/notImplemented";
import { loginSchema, registerSchema } from "./schema";

export async function register(req: Request, res: Response): Promise<void> {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ errors: parseResult.error.flatten() });
    return;
  }

  notImplemented(res, "POST /api/auth/register");
}

export async function login(req: Request, res: Response): Promise<void> {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ errors: parseResult.error.flatten() });
    return;
  }

  notImplemented(res, "POST /api/auth/login");
}
