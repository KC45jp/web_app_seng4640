import { Types, isValidObjectId, type InferSchemaType, type Require_id } from "mongoose";
import type { CheckoutInput } from "./schema";
import type { Logger } from "pino";
import type { CheckoutResult, Order, OrderTimelineEntry } from "@seng4640/shared";

import { cartModel, cartSchema } from "@/db/models/cart.models";
import { orderModel, orderSchema } from "@/db/models/order.models";
import { productModel, productSchema } from "@/db/models/product.models";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
} from "@/utils/errors";

type CartDoc = Require_id<InferSchemaType<typeof cartSchema>> & { __v: number };
type ProductDoc = Require_id<InferSchemaType<typeof productSchema>>;
type OrderDoc = Require_id<InferSchemaType<typeof orderSchema>>;

function buildOrderTimeline(order: OrderDoc): OrderTimelineEntry[] {
  const placedAt = order.createdAt?.toISOString() ?? new Date().toISOString();
  return [
    {
      status: "placed",
      timestamp: placedAt,
    },
  ];
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

function resolveUnitPrice(product: ProductDoc, now: Date): number {
  const flashSalePrice = product.flashSalePrice ?? null;
  const flashSaleStartAt = product.flashSaleStartAt ?? null;
  const flashSaleEndAt = product.flashSaleEndAt ?? null;
  const flashSaleIsActive =
    product.isFlashSale &&
    flashSalePrice !== null &&
    (flashSaleStartAt === null || flashSaleStartAt <= now) &&
    (flashSaleEndAt === null || flashSaleEndAt >= now);

  return flashSaleIsActive ? flashSalePrice : product.price;
}

async function rollbackStock(
  restoredItems: Array<{ productId: Types.ObjectId; quantity: number }>,
  requestLogger: Logger
): Promise<void> {
  if (restoredItems.length === 0) {
    return;
  }

  const operations = restoredItems.map((item) => ({
    updateOne: {
      filter: { _id: item.productId },
      update: { $inc: { stock: item.quantity } },
    },
  }));

  await productModel.bulkWrite(operations, { ordered: false });
  requestLogger.warn(
    { restoredItemCount: restoredItems.length },
    "Checkout rollback restored product stock"
  );
}

export async function checkout(
  _userId: string,
  _input: CheckoutInput,
  requestLogger: Logger
): Promise<CheckoutResult> {
  requestLogger.debug(
    { userId: _userId, paymentMethod: _input.paymentMethod },
    "Checkout service started"
  );
  if (!isValidObjectId(_userId)) {
    requestLogger.warn({ userId: _userId }, "Invalid user id");
    throw new BadRequestError("Invalid user id");
  }

  const cart = await cartModel.findOne({ userId: _userId }).lean<CartDoc | null>();
  if (!cart || cart.items.length === 0) {
    requestLogger.info({ userId: _userId }, "Checkout failed because cart was empty");
    throw new BadRequestError("Cart is empty");
  }

  const now = new Date();
  const decrementedProducts: Array<{ productId: Types.ObjectId; quantity: number }> = [];
  let createdOrder: OrderDoc | null = null;

  try {
    const orderItems = [];
    let totalAmount = 0;

    for (const cartItem of cart.items) {
      const productId = cartItem.productId.toString();
      if (!Types.ObjectId.isValid(productId)) {
        requestLogger.warn({ userId: _userId, productId }, "Cart contains invalid product id");
        throw new BadRequestError("Cart contains invalid product id");
      }

      const product = await productModel
        .findOneAndUpdate(
          {
            _id: cartItem.productId,
            isActive: true,
            stock: { $gte: cartItem.quantity },
          },
          {
            $inc: { stock: -cartItem.quantity },
          },
          {
            new: true,
          }
        )
        .lean<ProductDoc | null>();

      if (!product) {
        const existingProduct = await productModel
          .findById(cartItem.productId)
          .select("_id isActive stock")
          .lean<{ _id: Types.ObjectId; isActive: boolean; stock: number } | null>();

        if (!existingProduct || !existingProduct.isActive) {
          requestLogger.info(
            { userId: _userId, productId },
            "Checkout failed because product was not found"
          );
          throw new NotFoundError("Product not found");
        }

        requestLogger.info(
          {
            userId: _userId,
            productId,
            requestedQuantity: cartItem.quantity,
            stock: existingProduct.stock,
          },
          "Checkout failed because stock was insufficient"
        );
        throw new ConflictError("Insufficient stock");
      }

      decrementedProducts.push({
        productId: product._id,
        quantity: cartItem.quantity,
      });

      const unitPrice = resolveUnitPrice(product, now);
      orderItems.push({
        productId: product._id,
        name: product.name,
        price: unitPrice,
        quantity: cartItem.quantity,
      });
      totalAmount += unitPrice * cartItem.quantity;
    }

    createdOrder = (
      await orderModel.create({
        userId: new Types.ObjectId(_userId),
        items: orderItems,
        totalAmount: Number(totalAmount.toFixed(2)),
        paymentMethod: _input.paymentMethod,
        status: "placed",
      })
    ).toObject() as OrderDoc;

    await cartModel.updateOne(
      { _id: cart._id },
      {
        $set: { items: [] },
        $inc: { __v: 1 },
      }
    );

    requestLogger.debug(
      {
        userId: _userId,
        orderId: createdOrder._id.toString(),
        itemCount: createdOrder.items.length,
      },
      "Checkout service completed"
    );

    return {
      order: serializeOrder(createdOrder),
    };
  } catch (error) {
    if (createdOrder) {
      try {
        await orderModel.deleteOne({ _id: createdOrder._id });
        requestLogger.warn(
          { userId: _userId, orderId: createdOrder._id.toString() },
          "Checkout rollback removed created order"
        );
      } catch (rollbackError) {
        requestLogger.error(
          {
            err: rollbackError,
            userId: _userId,
            orderId: createdOrder._id.toString(),
          },
          "Checkout rollback failed to remove created order"
        );
      }
    }

    try {
      await rollbackStock(decrementedProducts, requestLogger);
    } catch (rollbackError) {
      requestLogger.error(
        { err: rollbackError, userId: _userId },
        "Checkout rollback failed to restore product stock"
      );
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new ServiceUnavailableError("Checkout failed");
  }
}
