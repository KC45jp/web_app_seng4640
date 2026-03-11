
import type {
  AddCartItemInput,
  AddCartItemResult,
  GetCartResult,
  UpdateCartItemInput,
  UpdateCartItemResult,
  RemoveCartItemResult,
  RegisterResult,
} from "@seng4640/shared";
import {cartSchema, cartModel, type CreateCartInput} from "@/db/models/cart.models"
import type { Logger } from "pino";
import { logger } from "@/utils/logger";
import { UnauthorizedError, ConflictError, ServiceUnavailableError, BadRequestError, NotFoundError } from "../../utils/errors";

const cartServiceLogger = logger.child({ module: "cart-service" });
import {Types} from "mongoose";
import type { InferSchemaType, Require_id,  } from "mongoose";
import e from "express";

type CartDoc = Require_id<InferSchemaType<typeof cartSchema>>&{
  __v: number
};


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
): Promise<AddCartItemResult> {

  if (!Types.ObjectId.isValid(_input.productId)) throw new BadRequestError("invalid product id");
  const cart = await cartModel.findOneAndUpdate(
    {userId: _userId},
    { $setOnInsert: { userId: _userId, items: [] } }, // if insert
    { upsert: true, new: true }
  ).lean<CartDoc|null>()

  if (!cart) throw new ServiceUnavailableError("Upsert Cart Doc failed");

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

  if (!finalCart) throw new ConflictError("Cart was updated by another request");


  return serializeCart(finalCart);
}


async function removeItem(userId: string, productId: string): Promise<CartDoc|null> {
  const cart = await findCart(userId);
  if (!cart) return null;

  
  // items を消す処理
  return updatedCart;
}



export async function updateCartItemQuantity(
  _userId: string,
  _productId: string,
  _input: UpdateCartItemInput
): Promise<UpdateCartItemResult> {
  // TODO: implement update cart item.



}

export async function removeItemFromCart(
  _userId: string,
  _productId: string
): Promise<RemoveCartItemResult> {
  // TODO: implement remove cart item.
}
