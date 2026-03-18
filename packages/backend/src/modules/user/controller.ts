import type { Request, Response } from "express";
import { updateMeSchema } from "./schema";
import { validateOrRespond } from "../../utils/validation";
import { getRequestLogger } from "@/utils/requestLogger";
import { handleControllerError } from "@/utils/controllerError";
import { getMe as getMeService, updateMe as updateMeService } from "./service";

export async function getMe(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const userControllerLogger = requestLogger.child({ module: "user-controller" });
  if (!req.user) {
    userControllerLogger.warn({ route: "GET /api/me" }, "Unauthorized user request");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  userControllerLogger.debug(
    { route: "GET /api/me", userId: req.user.id },
    "Get me request received"
  );

  try {
    const result = await getMeService(req.user.id, requestLogger.child({ module: "user-service" }));
    res.status(200).json(result);
  } catch (error) {
    handleControllerError({
      error,
      res,
      logger: userControllerLogger,
      route: "GET /api/me",
      failureMessage: "Get me request failed",
      unexpectedMessage: "Unexpected error while handling get me request",
      context: { userId: req.user.id },
    });
  }
}

export async function patchMe(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const userControllerLogger = requestLogger.child({ module: "user-controller" });
  if (!req.user) {
    userControllerLogger.warn({ route: "PATCH /api/me" }, "Unauthorized user request");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  userControllerLogger.debug(
    { route: "PATCH /api/me", userId: req.user.id },
    "Patch me request received"
  );
  const input = validateOrRespond(updateMeSchema, req.body, res, "PATCH /api/me");
  if (input === null) {
    userControllerLogger.debug(
      { route: "PATCH /api/me", userId: req.user.id },
      "Patch me request rejected due to invalid input"
    );
    return;
  }

  try {
    const result = await updateMeService(
      req.user.id,
      input,
      requestLogger.child({ module: "user-service" })
    );
    res.status(200).json(result);
  } catch (error) {
    handleControllerError({
      error,
      res,
      logger: userControllerLogger,
      route: "PATCH /api/me",
      failureMessage: "Patch me request failed",
      unexpectedMessage: "Unexpected error while handling patch me request",
      context: { userId: req.user.id },
    });
  }
}
