import axios from "axios";
import type {
  AdminListManagedProductsResult,
  AdminListManagersResult,
  GetProductByIdResult,
  ListProductsQuery,
  ListProductsResult,
  Product,
  LoginInput,
  LoginResult,
} from "@seng4640/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export function resolveImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith("/")) {
    return `${API_BASE_URL}${imageUrl}`;
  }
  return imageUrl;
}

const api = axios.create({
  baseURL: API_BASE_URL,
});
export async function login(input: LoginInput): Promise<LoginResult> {
  const response = await api.post<LoginResult>("/api/auth/login", input);
  return response.data;
}

function authHeader(token: string | null) {
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function normalizeProductList(payload: unknown): Product[] {
  if (Array.isArray(payload)) {
    return payload as Product[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "items" in payload &&
    Array.isArray((payload as { items: unknown }).items)
  ) {
    return (payload as { items: Product[] }).items;
  }

  return [];
}

export async function listProducts(query: ListProductsQuery): Promise<ListProductsResult> {
  const response = await api.get<ListProductsResult>("/api/products", { params: query });
  const data = response.data;
  if (data && typeof data === "object" && Array.isArray(data.items)) {
    return data;
  }
  return { items: normalizeProductList(data), total: 0, page: query.page ?? 1, limit: query.limit ?? 20 };
}

export async function getProductById(id: string): Promise<GetProductByIdResult> {
  const response = await api.get<GetProductByIdResult>(`/api/products/${id}`);
  return response.data;
}

export async function searchPublicProducts(query: string): Promise<Product[]> {
  const response = await api.get("/api/products", {
    params: query ? { q: query } : undefined,
  });

  return normalizeProductList(response.data);
}

export async function fetchManagerProducts(token: string | null): Promise<Product[]> {
  try {
    const response = await api.get<AdminListManagedProductsResult>("/api/admin/products/mine", {
      headers: authHeader(token),
    });
    return normalizeProductList(response.data);
  } catch {
    // Backward compatibility: some backend branches expose /api/admin/products.
    const response = await api.get<AdminListManagedProductsResult>("/api/admin/products", {
      headers: authHeader(token),
    });
    return normalizeProductList(response.data);
  }
}

export type ProductOwner = {
  id: string;
  name: string;
  email: string;
  role: "manager";
};

export async function fetchProductOwners(token: string | null): Promise<ProductOwner[]> {
  const response = await api.get<AdminListManagersResult>("/api/admin/managers", {
    headers: authHeader(token),
  });

  if (Array.isArray(response.data?.items)) {
    return response.data.items;
  }

  return [];
}
