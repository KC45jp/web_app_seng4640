import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "./schema";
import {
  login as loginCustomer,
  registerCustomer,
} from "./service";
import { validateOrRespond } from "../../utils/validation";
import { getRequestLogger } from "@/utils/requestLogger";
import { handleControllerError } from "@/utils/controllerError";

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
    handleControllerError({
      error,
      res,
      logger: authControllerLogger,
      route: "POST /api/auth/register",
      failureMessage: "Register request failed",
      unexpectedMessage: "Unexpected error while handling register request",
    });
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
    handleControllerError({
      error,
      res,
      logger: authControllerLogger,
      route: "POST /api/auth/login",
      failureMessage: "Login request failed",
      unexpectedMessage: "Unexpected error while handling login request",
    });
  }
}
