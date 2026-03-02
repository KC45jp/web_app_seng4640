import type { Response } from "express";

export function notImplemented(res: Response, feature: string): void {
  res.status(501).json({
    message: `${feature} is not implemented yet.`,
  });
}
