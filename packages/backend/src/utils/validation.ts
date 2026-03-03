import type { Response } from "express";
import { z } from "zod";
import { logger } from "./logger";

export function validateOrRespond<T>(
  schema: z.ZodType<T>,
  input: unknown,
  res: Response,
  route: string
): T | null {
  const parseResult = schema.safeParse(input);
  if (!parseResult.success) {
    logger.warn({ issues: parseResult.error.issues, route }, "Validation failed");
    res.status(400).json({
      errors: z.flattenError(parseResult.error),
    });
    return null;
  }

  return parseResult.data;
}
