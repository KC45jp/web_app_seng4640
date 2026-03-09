import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

import { logger } from "@/utils/logger";

function getRequestId(req: Request, key_value?: string): string {

  if(key_value) return key_value;

  const headerValue = req.header("x-request-id");
  if (typeof headerValue === "string" && headerValue.trim().length > 0) {
    return headerValue.trim();
  }
  return randomUUID();
}

export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const requestId = getRequestId(req);
  const startedAt = process.hrtime.bigint();

  req.requestId = requestId;
  req.log = logger.child({
    requestId,
    method: req.method,
    path: req.originalUrl,
  });

  res.setHeader("X-Request-Id", requestId);

  req.log.info("Request started");

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    req.log?.info(
      {
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(1)),
      },
      "Request completed"
    );
  });

  next();
}
