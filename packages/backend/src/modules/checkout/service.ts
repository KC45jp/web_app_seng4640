import mongoose, { Types, isValidObjectId, type InferSchemaType, type Require_id } from "mongoose";
import type { CheckoutInput } from "./schema";
import type { Logger } from "pino";
import type { CheckoutResult, Order, OrderTimelineEntry } from "@seng4640/shared";

import { cartModel, cartSchema } from "@/db/models/cart.models";
import { orderModel, orderSchema, type CreateOrderInput } from "@/db/models/order.models";
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

  const session = await mongoose.connection.startSession();

  try {
    const checkoutResult = await session.withTransaction(async (): Promise<CheckoutResult> => {
      const cart = await cartModel
        .findOne({ userId: _userId })
        .session(session)
        .lean<CartDoc | null>();
      if (!cart || cart.items.length === 0) {
        requestLogger.info({ userId: _userId }, "Checkout failed because cart was empty");
        throw new BadRequestError("Cart is empty");
      }

      const now = new Date();
      const orderItems: CreateOrderInput["items"] = [];
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
              session,
            }
          )
          .lean<ProductDoc | null>();

        if (!product) {
          const existingProduct = await productModel
            .findById(cartItem.productId)
            .session(session)
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

        const unitPrice = resolveUnitPrice(product, now);
        orderItems.push({
          productId: product._id,
          name: product.name,
          price: unitPrice,
          quantity: cartItem.quantity,
        });
        totalAmount += unitPrice * cartItem.quantity;
      }

      const [createdOrderDoc] = await orderModel.create(
        [
          {
            userId: new Types.ObjectId(_userId),
            items: orderItems,
            totalAmount: Number(totalAmount.toFixed(2)),
            paymentMethod: _input.paymentMethod,
            status: "placed",
          },
        ],
        { session }
      );
      const createdOrder = createdOrderDoc.toObject() as OrderDoc;

      const clearedCart = await cartModel.updateOne(
        { _id: cart._id, __v: cart.__v },
        {
          $set: { items: [] },
          $inc: { __v: 1 },
        },
        { session }
      );

      if (clearedCart.matchedCount === 0) {
        requestLogger.info(
          { userId: _userId, cartId: cart._id.toString() },
          "Checkout failed because cart changed during checkout"
        );
        throw new ConflictError("Cart was updated by another request");
      }

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
    });

    if (!checkoutResult) {
      throw new ServiceUnavailableError("Checkout failed");
    }

    return checkoutResult;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new ServiceUnavailableError("Checkout failed");
  } finally {
    await session.endSession();
  }
}
