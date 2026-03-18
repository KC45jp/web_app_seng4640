import { isValidObjectId, type InferSchemaType, type Require_id } from "mongoose";
import type { Logger } from "pino";
import type {
  GetOrderByIdResult,
  ListOrdersResult,
  Order,
  OrderTimelineEntry,
} from "@seng4640/shared";

import { orderModel, orderSchema } from "@/db/models/order.models";
import { BadRequestError, NotFoundError } from "@/utils/errors";

type OrderDoc = Require_id<InferSchemaType<typeof orderSchema>>;

function buildOrderTimeline(order: OrderDoc): OrderTimelineEntry[] {
  const placedAt = order.createdAt?.toISOString() ?? new Date().toISOString();
  const timeline: OrderTimelineEntry[] = [
    {
      status: "placed",
      timestamp: placedAt,
    },
  ];

  if (order.status !== "placed") {
    timeline.push({
      status: order.status,
      timestamp: order.updatedAt?.toISOString() ?? placedAt,
    });
  }

  return timeline;
}

function serializeOrder(order: OrderDoc): Order {
  return {
    _id: order._id.toString(),
    userId: order.userId.toString(),
    items: order.items.map((item) => ({
      productId: item.productId.toString(),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
    totalAmount: order.totalAmount,
    status: order.status,
    paymentMethod: order.paymentMethod,
    timeline: buildOrderTimeline(order),
    createdAt: order.createdAt?.toISOString(),
    updatedAt: order.updatedAt?.toISOString(),
  };
}

export async function listOrders(
  _userId: string,
  requestLogger: Logger
): Promise<ListOrdersResult> {
  requestLogger.debug({ userId: _userId }, "List orders service started");
  if (!isValidObjectId(_userId)) {
    requestLogger.warn({ userId: _userId }, "Invalid user id");
    throw new BadRequestError("Invalid user id");
  }

  const orders = await orderModel
    .find({ userId: _userId })
    .sort({ createdAt: -1 })
    .lean<OrderDoc[]>();

  requestLogger.debug(
    { userId: _userId, orderCount: orders.length },
    "List orders service completed"
  );

  return {
    items: orders.map(serializeOrder),
  };
}

export async function getOrderById(
  _userId: string,
  _orderId: string,
  requestLogger: Logger
): Promise<GetOrderByIdResult> {
  requestLogger.debug(
    { userId: _userId, orderId: _orderId },
    "Get order by id service started"
  );
  if (!isValidObjectId(_userId)) {
    requestLogger.warn({ userId: _userId }, "Invalid user id");
    throw new BadRequestError("Invalid user id");
  }

  if (!isValidObjectId(_orderId)) {
    requestLogger.warn({ orderId: _orderId }, "Invalid order id");
    throw new BadRequestError("Invalid order id");
  }

  const order = await orderModel
    .findOne({ _id: _orderId, userId: _userId })
    .lean<OrderDoc | null>();

  if (!order) {
    requestLogger.info(
      { userId: _userId, orderId: _orderId },
      "Order not found"
    );
    throw new NotFoundError("Order not found");
  }

  requestLogger.debug(
    { userId: _userId, orderId: _orderId },
    "Get order by id service completed"
  );

  return {
    order: serializeOrder(order),
  };
}
