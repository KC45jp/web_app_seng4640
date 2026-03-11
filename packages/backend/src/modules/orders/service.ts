import type { Logger } from "pino";

export async function listOrders(_userId: string, requestLogger: Logger): Promise<void> {
  requestLogger.debug({ userId: _userId }, "List orders service started");
  // TODO: implement list own orders.
}

export async function getOrderById(
  _userId: string,
  _orderId: string,
  requestLogger: Logger
): Promise<void> {
  requestLogger.debug(
    { userId: _userId, orderId: _orderId },
    "Get order by id service started"
  );
  // TODO: implement order details/tracking.
}
