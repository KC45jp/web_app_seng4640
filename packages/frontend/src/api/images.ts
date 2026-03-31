import axios from "axios";
import type { UploadImageResult } from "@seng4640/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

const api = axios.create({ baseURL: API_BASE_URL });

function authHeader(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function uploadProductImage(
  token: string | null,
  file: File,
): Promise<UploadImageResult> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await api.post<UploadImageResult>("/api/images", formData, {
    headers: authHeader(token),
  });

  return response.data;
}
