import type { CheckoutInput } from "./schema";
import type { Logger } from "pino";

export async function checkout(
  _userId: string,
  _input: CheckoutInput,
  requestLogger: Logger
): Promise<void> {
  requestLogger.debug(
    { userId: _userId, paymentMethod: _input.paymentMethod },
    "Checkout service started"
  );
  // TODO: implement checkout with atomic stock updates.
}
