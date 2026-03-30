import axios from "axios";
import type { CheckoutInput, CheckoutResult } from "@seng4640/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

const api = axios.create({ baseURL: API_BASE_URL });

function authHeader(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function checkout(
  token: string | null,
  input: CheckoutInput,
): Promise<CheckoutResult> {
  const response = await api.post<CheckoutResult>("/api/checkout", input, {
    headers: authHeader(token),
  });
  return response.data;
}
