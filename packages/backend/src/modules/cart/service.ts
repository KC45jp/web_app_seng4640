
import type {
  AddCartItemInput,
  AddCartItemResult,
  GetCartResult,
  UpdateCartItemInput,
  UpdateCartItemResult,
  RemoveCartItemResult,
} from "@seng4640/shared";
import { cartSchema, cartModel } from "@/db/models/cart.models";
import type { Logger } from "pino";
import {
  ConflictError,
  ServiceUnavailableError,
  BadRequestError,
  NotFoundError,
} from "../../utils/errors";

import { Types } from "mongoose";
import type { InferSchemaType, Require_id } from "mongoose";

type CartDoc = Require_id<InferSchemaType<typeof cartSchema>> & {
  __v: number;
};


async function findCart(userIdRaw: string): Promise<CartDoc | null> {
  const userId = userIdRaw;

  return cartModel.findOne({ userId }).lean<CartDoc | null>();
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

export async function getCartByUserId(
  _userId: string,
  requestLogger: Logger
): Promise<GetCartResult> {
  requestLogger.debug({ userId: _userId }, "Get cart started");
  const cart = await findCart(_userId);
  if (!cart) {
    requestLogger.debug(
      { userId: _userId },
      "Cart not found, returning empty cart"
    );
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
  _input: AddCartItemInput,
  requestLogger: Logger
): Promise<AddCartItemResult> {
  requestLogger.debug(
    { userId: _userId, productId: _input.productId, quantity: _input.quantity },
    "Add item to cart started"
  );

  if (!Types.ObjectId.isValid(_input.productId)) {
    requestLogger.warn({ productId: _input.productId }, "Invalid product id");
    throw new BadRequestError("invalid product id");
  }
  const cart = await cartModel.findOneAndUpdate(
    {userId: _userId},
    { $setOnInsert: { userId: _userId, items: [] } }, // if insert
    { upsert: true, new: true }
  ).lean<CartDoc|null>()

  if (!cart) {
    requestLogger.error({ userId: _userId }, "Cart upsert returned no document");
    throw new ServiceUnavailableError("Upsert Cart Doc failed");
  }

  const existingIndex = cart.items.findIndex(
    (item) => item.productId.toString() === _input.productId
  )
  if (existingIndex >=0){
    cart.items[existingIndex].quantity += _input.quantity;
  }
  else{
    cart.items.push({
      productId: new  Types.ObjectId(_input.productId),
      quantity: _input.quantity
    });
  }

  const finalCart = await cartModel.findOneAndUpdate(
    {
      userId: _userId,
      __v : cart.__v,
    },
    { 
      $set: { items: cart.items } ,
      $inc: { __v: 1 }//for the optimistic lock
    },
    {new: true}
  ).lean<CartDoc|null>();

  if (!finalCart) {
    requestLogger.warn({ userId: _userId }, "Add item failed due to cart version conflict");
    throw new ConflictError("Cart was updated by another request");
  }

  requestLogger.debug(
    { userId: _userId, productId: _input.productId, itemCount: finalCart.items.length },
    "Add item to cart completed"
  );


  return serializeCart(finalCart);
}


async function removeItem(
  userId: string,
  productId: string,
  requestLogger: Logger
): Promise<CartDoc> {
  const cart = await findCart(userId);
  if (!cart) {
    requestLogger.info({ userId, productId }, "Remove item failed because cart was not found");
    throw new NotFoundError("Cart Not Found");
  }

  const existingIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId
  )

  if (existingIndex < 0) {
    requestLogger.debug(
      { userId, productId },
      "Remove item skipped because product was not in cart"
    );
    return cart;
  }

  cart.items.splice(existingIndex, 1);

  const finalcart = await cartModel.findOneAndUpdate(
    {userId, __v: cart.__v},
    {$set: { items: cart.items}, $inc: {__v: 1}},
    {new: true}
  )

  if (!finalcart) {
    requestLogger.warn({ userId, productId }, "Remove item failed due to cart version conflict");
    throw new ConflictError("Cart was updated by another request");
  }
  requestLogger.debug(
    { userId, productId, itemCount: finalcart.items.length },
    "Remove item completed"
  );
  return finalcart;
}



export async function updateCartItemQuantity(
  _userId: string,
  _productId: string,
  _input: UpdateCartItemInput,
  requestLogger: Logger
): Promise<UpdateCartItemResult> {
  requestLogger.debug(
    { userId: _userId, productId: _productId, quantity: _input.quantity },
    "Update cart item quantity started"
  );
  if (!Types.ObjectId.isValid(_productId)) {
    requestLogger.warn({ productId: _productId }, "Invalid product id");
    throw new BadRequestError("invalid product id");
  }

  if (_input.quantity < 0) {
    requestLogger.warn(
      { userId: _userId, productId: _productId, quantity: _input.quantity },
      "Cart item quantity must not be negative"
    );
    throw new BadRequestError("cart item quantity must not be negative");
  }

  if (_input.quantity <= 0){
    const updatedCart = await removeItem(_userId, _productId, requestLogger);
    return serializeCart(updatedCart);
  }

  const cart = await findCart(_userId);
  if (!cart) {
    requestLogger.info({ userId: _userId }, "Update cart item failed because cart was not found");
    throw new NotFoundError("Cart Not Found");
  }

  const existingIndex = cart.items.findIndex(
    (item) => item.productId.toString() === _productId
  )

  if (existingIndex < 0) {
    requestLogger.info(
      { userId: _userId, productId: _productId },
      "Update cart item failed because product was not found in cart"
    );
    throw new NotFoundError("Item Not Found");
  }
  
  cart.items[existingIndex].quantity = _input.quantity;
  const finalCart = await cartModel.findOneAndUpdate(
    {
      userId: _userId,
      __v : cart.__v,
    },
    { 
      $set: { items: cart.items } ,
      $inc: { __v: 1 }//for the optimistic lock
    },
    {new: true}
  ).lean<CartDoc|null>();

  if (!finalCart) {
    requestLogger.warn(
      { userId: _userId, productId: _productId },
      "Update cart item failed due to cart version conflict"
    );
    throw new ConflictError("Cart was updated by another request");
  }

  requestLogger.debug(
    { userId: _userId, productId: _productId, quantity: _input.quantity },
    "Update cart item quantity completed"
  );

  return serializeCart(finalCart);
}

export async function removeItemFromCart(
  _userId: string,
  _productId: string,
  requestLogger: Logger
): Promise<RemoveCartItemResult> {
  requestLogger.debug(
    { userId: _userId, productId: _productId },
    "Remove item from cart started"
  );
  if (!Types.ObjectId.isValid(_productId)) {
    requestLogger.warn({ productId: _productId }, "Invalid product id");
    throw new BadRequestError("invalid product id");
  }

  const updatedCart = await removeItem(_userId, _productId, requestLogger);
  
  return serializeCart(updatedCart);
}
