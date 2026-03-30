import axios from "axios";
import type { ListOrdersResult } from "@seng4640/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

const api = axios.create({ baseURL: API_BASE_URL });

function authHeader(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listOrders(token: string | null): Promise<ListOrdersResult> {
  const response = await api.get<ListOrdersResult>("/api/orders", {
    headers: authHeader(token),
  });
  return response.data;
}
