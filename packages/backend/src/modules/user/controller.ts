import type { Request, Response } from "express";
import { notImplemented } from "../../utils/notImplemented";
import { updateMeSchema } from "./schema";
import { validateOrRespond } from "../../utils/validation";
import { getRequestLogger } from "@/utils/requestLogger";

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
  notImplemented(res, "GET /api/me");
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
  if (
    validateOrRespond(updateMeSchema, req.body, res, "PATCH /api/me") === null
  ) {
    userControllerLogger.debug(
      { route: "PATCH /api/me", userId: req.user.id },
      "Patch me request rejected due to invalid input"
    );
    return;
  }

  notImplemented(res, "PATCH /api/me");
}
