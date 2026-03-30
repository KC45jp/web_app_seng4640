import axios from "axios";
import type { GetMeResult, UpdateMeInput, UpdateMeResult } from "@seng4640/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

const api = axios.create({ baseURL: API_BASE_URL });

function authHeader(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getMe(token: string | null): Promise<GetMeResult> {
  const response = await api.get<GetMeResult>("/api/me", {
    headers: authHeader(token),
  });
  return response.data;
}

export async function updateMe(
  token: string | null,
  input: UpdateMeInput,
): Promise<UpdateMeResult> {
  const response = await api.patch<UpdateMeResult>("/api/me", input, {
    headers: authHeader(token),
  });
  return response.data;
}
