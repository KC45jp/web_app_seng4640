import mongoose, { Types } from "mongoose";
import { MongoServerError } from "mongodb";

import { cartModel } from "@/db/models/cart.models";
import { orderModel } from "@/db/models/order.models";
import { productModel } from "@/db/models/product.models";
import { logger } from "@/utils/logger";
import { ConflictError } from "@/utils/errors";
import { checkout } from "./service";

jest.mock("@/db/models/cart.models", () => ({
  cartModel: {
    findOne: jest.fn(),
    updateOne: jest.fn(),
  },
  cartSchema: {},
}));

jest.mock("@/db/models/order.models", () => ({
  orderModel: {
    create: jest.fn(),
  },
  orderSchema: {},
}));

jest.mock("@/db/models/product.models", () => ({
  productModel: {
    findOneAndUpdate: jest.fn(),
    findById: jest.fn(),
  },
  productSchema: {},
}));

const testLogger = logger.child({
  requestId: "test-request-id",
  module: "checkout-service-test",
});

describe("checkout service", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("retries transient MongoDB write conflicts and eventually succeeds", async () => {
    const userId = new Types.ObjectId().toString();
    const productId = new Types.ObjectId();
    const cartId = new Types.ObjectId();
    const orderId = new Types.ObjectId();

    (cartModel.findOne as unknown as jest.Mock).mockReturnValue(
      buildQuery({
        _id: cartId,
        __v: 0,
        items: [{ productId, quantity: 1 }],
      })
    );
    (productModel.findOneAndUpdate as unknown as jest.Mock).mockReturnValue(
      buildQuery({
        _id: productId,
        name: "Load Test Product",
        price: 99.99,
        isFlashSale: false,
        flashSalePrice: null,
        flashSaleStartAt: null,
        flashSaleEndAt: null,
      })
    );
    (orderModel.create as unknown as jest.Mock).mockResolvedValue([
      {
        toObject: () => ({
          _id: orderId,
          userId: new Types.ObjectId(userId),
          items: [
            {
              productId,
              name: "Load Test Product",
              price: 99.99,
              quantity: 1,
            },
          ],
          totalAmount: 99.99,
          paymentMethod: "credit_card",
          status: "placed",
          createdAt: new Date("2026-04-04T11:00:00.000Z"),
          updatedAt: new Date("2026-04-04T11:00:00.000Z"),
        }),
      },
    ]);
    (cartModel.updateOne as unknown as jest.Mock).mockResolvedValue({ matchedCount: 1 });

    const transientError = new MongoServerError({
      errmsg: "Write conflict",
      code: 112,
    });
    const firstSession = {
      withTransaction: jest.fn().mockRejectedValue(transientError),
      endSession: jest.fn().mockResolvedValue(undefined),
    };
    const secondSession = {
      withTransaction: jest.fn(async (callback: () => Promise<unknown>) => callback()),
      endSession: jest.fn().mockResolvedValue(undefined),
    };
    const startSessionSpy = jest
      .spyOn(mongoose.connection, "startSession")
      .mockResolvedValueOnce(firstSession as never)
      .mockResolvedValueOnce(secondSession as never);

    const result = await checkout(
      userId,
      { paymentMethod: "credit_card" },
      testLogger
    );

    expect(result.order._id).toBe(orderId.toString());
    expect(startSessionSpy).toHaveBeenCalledTimes(2);
    expect(firstSession.endSession).toHaveBeenCalledTimes(1);
    expect(secondSession.endSession).toHaveBeenCalledTimes(1);
  });

  it("returns ConflictError when transient write conflicts keep happening", async () => {
    const userId = new Types.ObjectId().toString();
    const transientError = new MongoServerError({
      errmsg: "Write conflict",
      code: 112,
    });
    const startSessionSpy = jest.spyOn(mongoose.connection, "startSession");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      startSessionSpy.mockResolvedValueOnce({
        withTransaction: jest.fn().mockRejectedValue(transientError),
        endSession: jest.fn().mockResolvedValue(undefined),
      } as never);
    }

    await expect(
      checkout(userId, { paymentMethod: "credit_card" }, testLogger)
    ).rejects.toMatchObject({
      message: "Checkout conflicted with another request. Please retry",
    } satisfies Partial<ConflictError>);

    expect(startSessionSpy).toHaveBeenCalledTimes(5);
  });
});

function buildQuery<T>(value: T) {
  return {
    session: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(value),
  };
}
