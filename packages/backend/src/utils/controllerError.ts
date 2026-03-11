import type { Response } from "express";
import type { Logger } from "pino";

import { AppError } from "@/utils/errors";

type HandleControllerErrorInput = {
  error: unknown;
  res: Response;
  logger: Logger;
  route: string;
  failureMessage: string;
  unexpectedMessage: string;
  context?: Record<string, unknown>;
};

export function handleControllerError({
  error,
  res,
  logger,
  route,
  failureMessage,
  unexpectedMessage,
  context = {},
}: HandleControllerErrorInput): void {
  if (error instanceof AppError) {
    logger.warn(
      {
        route,
        status: error.status,
        error: error.message,
        ...context,
      },
      failureMessage
    );
    res.status(error.status).json({ message: error.message });
    return;
  }

  logger.error(
    {
      err: error,
      route,
      ...context,
    },
    unexpectedMessage
  );
  res.status(500).json({ message: "Internal server error" });
}
