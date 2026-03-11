import type { Request } from "express";
import type { Logger } from "pino";

import { logger } from "@/utils/logger";

export function getRequestLogger(req: Request): Logger {
  return (
    req.log ??
    logger.child({
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
    })
  );
}
