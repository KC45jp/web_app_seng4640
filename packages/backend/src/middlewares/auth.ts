import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../types/auth";

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authorization = req.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  // TODO: verify JWT and extract user context from token payload.
  const roleFromToken = "customer" as UserRole;
  req.user = { id: "TODO_USER_ID", role: roleFromToken };
  next();
}
