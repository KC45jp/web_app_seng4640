import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "./schema";
import {
  login as loginCustomer,
  registerCustomer,
} from "./service";
import { AppError } from "../../utils/errors";

export async function register(req: Request, res: Response): Promise<void> {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ errors: parseResult.error.flatten() });
    return;
  }

  try {
    const result = await registerCustomer(parseResult.data);
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
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ errors: parseResult.error.flatten() });
    return;
  }

  try {
    await loginCustomer(parseResult.data);
    res.status(200).json({ message: "Login accepted" });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}
