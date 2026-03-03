import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";
import {authValidation} from "./auth/authorization"


export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authorization = req.header("authorization");
  try {
    req.user = authValidation(authorization);
    next();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}


