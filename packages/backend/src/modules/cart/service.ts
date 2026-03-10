import type { AddCartItemInput, UpdateCartItemInput } from "./schema";
import {
  type AddCartItemResult,
  type GetCartResult,
  type RegisterResult,
} from "@seng4640/shared";
import {cartSchema, cartModel, type CreateCartInput} from "@/db/models/cart.models"
import type { Logger } from "pino";
import { logger } from "@/utils/logger";
import { UnauthorizedError, ConflictError, ServiceUnavailableError } from "../../utils/errors";

const cartServiceLogger = logger.child({ module: "cart-service" });

import type { InferSchemaType, Require_id } from "mongoose";

type CartDoc = Require_id<InferSchemaType<typeof cartSchema>>;


async function findCart(userIdRaw: string):Promise<CartDoc|null>{
  const userId = userIdRaw
  
  return cartModel
    .findOne({userId})
    .lean<CartDoc|null>();
}

function serializeCart(cart: CartDoc): GetCartResult {
  return {
    cart: {
      userId: cart.userId.toString(),
      items: cart.items.map((item) => ({
        productId: item.productId.toString(),
        quantity: item.quantity,
      })),
      updatedAt: cart.updatedAt?.toISOString(),
    },
  };
}

export async function getCartByUserId(_userId: string, requestLogger : Logger = cartServiceLogger): Promise<GetCartResult> {
  requestLogger.debug({_userId}, "Request Service started")
  const cart = await findCart(_userId);
  if (!cart) {
    requestLogger.debug({_userId},"Cart not found, returning empty cart")
    return {
      cart: {
        userId: _userId,
        items: [],
      },
    };
  }

  return serializeCart(cart);
}

export async function addItemToCart(
  _userId: string,
  _input: AddCartItemInput
): Promise<void> {
  // TODO: implement add cart item.



}

export async function updateCartItemQuantity(
  _userId: string,
  _productId: string,
  _input: UpdateCartItemInput
): Promise<void> {
  // TODO: implement update cart item.
}

export async function removeItemFromCart(
  _userId: string,
  _productId: string
): Promise<void> {
  // TODO: implement remove cart item.
}
