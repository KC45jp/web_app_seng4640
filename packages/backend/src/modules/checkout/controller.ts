import type { Request, Response } from "express";
import { checkoutSchema } from "./schema";
import { validateOrRespond } from "../../utils/validation";
import { getRequestLogger } from "@/utils/requestLogger";
import { handleControllerError } from "@/utils/controllerError";
import { checkout as checkoutService } from "./service";

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
  const input = validateOrRespond(checkoutSchema, req.body, res, "POST /api/checkout");
  if (input === null) {
    checkoutControllerLogger.debug(
      { route: "POST /api/checkout", userId: req.user.id },
      "Checkout request rejected due to invalid input"
    );
    return;
  }

  try {
    const result = await checkoutService(
      req.user.id,
      input,
      requestLogger.child({ module: "checkout-service" })
    );
    res.status(200).json(result);
  } catch (error) {
    handleControllerError({
      error,
      res,
      logger: checkoutControllerLogger,
      route: "POST /api/checkout",
      failureMessage: "Checkout request failed",
      unexpectedMessage: "Unexpected error while handling checkout request",
      context: { userId: req.user.id, paymentMethod: input.paymentMethod },
    });
  }
}
