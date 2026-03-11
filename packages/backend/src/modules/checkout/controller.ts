import type { Request, Response } from "express";
import { notImplemented } from "../../utils/notImplemented";
import { checkoutSchema } from "./schema";
import { validateOrRespond } from "../../utils/validation";
import { getRequestLogger } from "@/utils/requestLogger";

export async function checkout(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const checkoutControllerLogger = requestLogger.child({ module: "checkout-controller" });
  if (!req.user) {
    checkoutControllerLogger.warn(
      { route: "POST /api/checkout" },
      "Unauthorized checkout request"
    );
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  checkoutControllerLogger.debug(
    { route: "POST /api/checkout", userId: req.user.id },
    "Checkout request received"
  );
  if (validateOrRespond(checkoutSchema, req.body, res, "POST /api/checkout") === null) {
    checkoutControllerLogger.debug(
      { route: "POST /api/checkout", userId: req.user.id },
      "Checkout request rejected due to invalid input"
    );
    return;
  }

  notImplemented(res, "POST /api/checkout");
}
