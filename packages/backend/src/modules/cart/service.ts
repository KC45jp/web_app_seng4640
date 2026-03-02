import type { AddCartItemInput, UpdateCartItemInput } from "./schema";

export async function getCart(_userId: string): Promise<void> {
  // TODO: implement get cart.
}

export async function addCartItem(
  _userId: string,
  _input: AddCartItemInput
): Promise<void> {
  // TODO: implement add cart item.
}

export async function updateCartItem(
  _userId: string,
  _productId: string,
  _input: UpdateCartItemInput
): Promise<void> {
  // TODO: implement update cart item.
}

export async function removeCartItem(
  _userId: string,
  _productId: string
): Promise<void> {
  // TODO: implement remove cart item.
}
