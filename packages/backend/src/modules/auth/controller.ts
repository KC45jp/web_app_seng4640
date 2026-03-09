import type { Request, Response } from "express";
import type { Logger } from "pino";
import { loginSchema, registerSchema } from "./schema";
import {
  login as loginCustomer,
  registerCustomer,
} from "./service";
import { AppError } from "../../utils/errors";
import { validateOrRespond } from "../../utils/validation";
import { logger } from "@/utils/logger";

function getRequestLogger(req: Request): Logger {
  return (
    req.log ??
    logger.child({
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
    })
  );
}

export async function register(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const authControllerLogger = requestLogger.child({ module: "auth-controller" });
  const authServiceLogger = requestLogger.child({ module: "auth-service" });
  const input = validateOrRespond(registerSchema, req.body, res, "POST /api/auth/register");
  authControllerLogger.debug(
    {
      route: "POST /api/auth/register",
      email: req.body?.email,
      name: req.body?.name,
    },
    "Register request received"
  );
  if (input === null) {
    authControllerLogger.debug(
      { route: "POST /api/auth/register" },
      "Register request rejected due to invalid input"
    );
    return;
  }

  try {
    const result = await registerCustomer(input, authServiceLogger);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      authControllerLogger.warn(
        {
          route: "POST /api/auth/register",
          status: error.status,
          error: error.message,
        },
        "Register request failed"
      );
      res.status(error.status).json({ message: error.message });
      return;
    }
    authControllerLogger.error(
      { err: error, route: "POST /api/auth/register" },
      "Unexpected error while handling register request"
    );
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const authControllerLogger = requestLogger.child({ module: "auth-controller" });
  const authServiceLogger = requestLogger.child({ module: "auth-service" });
  const input = validateOrRespond(loginSchema, req.body, res, "POST /api/auth/login");
  authControllerLogger.debug(
    {
      route: "POST /api/auth/login",
      email: req.body?.email,
    },
    "Login request received"
  );
  if (input === null) {
    authControllerLogger.debug(
      { route: "POST /api/auth/login" },
      "Login request rejected due to invalid input"
    );
    return;
  }

  try {
    const result = await loginCustomer(input, authServiceLogger);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      authControllerLogger.warn(
        {
          route: "POST /api/auth/login",
          status: error.status,
          error: error.message,
        },
        "Login request failed"
      );
      res.status(error.status).json({ message: error.message });
      return;
    }
    authControllerLogger.error(
      { err: error, route: "POST /api/auth/login" },
      "Unexpected error while handling login request"
    );
    res.status(500).json({ message: "Internal server error" });
  }
}
