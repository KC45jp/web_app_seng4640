import axios from "axios";
import type { LoginInput, LoginResult, RegisterInput, RegisterResult } from "@seng4640/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export async function login(input: LoginInput): Promise<LoginResult> {
  const response = await api.post<LoginResult>("/api/auth/login", input);
  return response.data;
}

export async function register(input: RegisterInput): Promise<RegisterResult> {
  const response = await api.post<RegisterResult>("/api/auth/register", input);
  return response.data;
}
