import axios from "axios";
import type {
  GetCartResult,
  AddCartItemInput,
  AddCartItemResult,
  UpdateCartItemResult,
  RemoveCartItemResult,
} from "@seng4640/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

const api = axios.create({ baseURL: API_BASE_URL });

function authHeader(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getCart(token: string | null): Promise<GetCartResult> {
  const response = await api.get<GetCartResult>("/api/cart", {
    headers: authHeader(token),
  });
  return response.data;
}

export async function addCartItem(
  token: string | null,
  input: AddCartItemInput,
): Promise<AddCartItemResult> {
  const response = await api.post<AddCartItemResult>("/api/cart/items", input, {
    headers: authHeader(token),
  });
  return response.data;
}

export async function updateCartItem(
  token: string | null,
  productId: string,
  quantity: number,
): Promise<UpdateCartItemResult> {
  const response = await api.patch<UpdateCartItemResult>(
    `/api/cart/items/${productId}`,
    { quantity },
    { headers: authHeader(token) },
  );
  return response.data;
}

export async function removeCartItem(
  token: string | null,
  productId: string,
): Promise<RemoveCartItemResult> {
  const response = await api.delete<RemoveCartItemResult>(
    `/api/cart/items/${productId}`,
    { headers: authHeader(token) },
  );
  return response.data;
}
