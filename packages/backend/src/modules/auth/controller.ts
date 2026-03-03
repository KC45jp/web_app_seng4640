import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "./schema";
import {
  login as loginCustomer,
  registerCustomer,
} from "./service";
import { AppError } from "../../utils/errors";
import { validateOrRespond } from "../../utils/validation";

export async function register(req: Request, res: Response): Promise<void> {
  const input = validateOrRespond(
    registerSchema,
    req.body,
    res,
    "POST /api/auth/register"
  );
  if (input === null) {
    return;
  }

  try {
    const result = await registerCustomer(input);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = validateOrRespond(loginSchema, req.body, res, "POST /api/auth/login");
  if (input === null) {
    return;
  }

  try {
    const result = await loginCustomer(input);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}
