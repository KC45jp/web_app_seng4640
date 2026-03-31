import axios from "axios";
import type {
  AdminCreateManagerInput,
  AdminCreateManagerResult,
  AdminCreateProductInput,
  AdminDeleteManagerResult,
  AdminListManagedProductsResult,
  AdminListManagersResult,
  AdminManagerSummary,
  AdminProductResult,
  AdminUpdateFlashSaleInput,
  AdminUpdateProductInput,
  Product,
} from "@seng4640/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

const api = axios.create({ baseURL: API_BASE_URL });

function authHeader(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
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

export async function fetchManagerProducts(token: string | null): Promise<Product[]> {
  try {
    const response = await api.get<AdminListManagedProductsResult>("/api/admin/products/mine", {
      headers: authHeader(token),
    });
    return normalizeProductList(response.data);
  } catch {
    const response = await api.get<AdminListManagedProductsResult>("/api/admin/products", {
      headers: authHeader(token),
    });
    return normalizeProductList(response.data);
  }
}

export async function getManagedProductById(
  token: string | null,
  productId: string,
): Promise<AdminProductResult> {
  const response = await api.get<AdminProductResult>(`/api/admin/products/${productId}`, {
    headers: authHeader(token),
  });
  return response.data;
}

export async function createManagedProduct(
  token: string | null,
  input: AdminCreateProductInput,
): Promise<AdminProductResult> {
  const response = await api.post<AdminProductResult>("/api/admin/products", input, {
    headers: authHeader(token),
  });
  return response.data;
}

export async function updateManagedProduct(
  token: string | null,
  productId: string,
  input: AdminUpdateProductInput,
): Promise<AdminProductResult> {
  const response = await api.patch<AdminProductResult>(`/api/admin/products/${productId}`, input, {
    headers: authHeader(token),
  });
  return response.data;
}

export async function deleteManagedProduct(
  token: string | null,
  productId: string,
): Promise<AdminProductResult> {
  const response = await api.delete<AdminProductResult>(`/api/admin/products/${productId}`, {
    headers: authHeader(token),
  });
  return response.data;
}

export async function updateManagedProductFlashSale(
  token: string | null,
  productId: string,
  input: AdminUpdateFlashSaleInput,
): Promise<AdminProductResult> {
  const response = await api.patch<AdminProductResult>(
    `/api/admin/products/${productId}/flash-sale`,
    input,
    {
      headers: authHeader(token),
    },
  );
  return response.data;
}

export async function fetchProductOwners(token: string | null): Promise<AdminManagerSummary[]> {
  const response = await api.get<AdminListManagersResult>("/api/admin/managers", {
    headers: authHeader(token),
  });

  if (Array.isArray(response.data?.items)) {
    return response.data.items;
  }

  return [];
}

export async function createManager(
  token: string | null,
  input: AdminCreateManagerInput,
): Promise<AdminCreateManagerResult> {
  const response = await api.post<AdminCreateManagerResult>("/api/admin/managers", input, {
    headers: authHeader(token),
  });
  return response.data;
}

export async function deleteManager(
  token: string | null,
  managerId: string,
): Promise<AdminDeleteManagerResult> {
  const response = await api.delete<AdminDeleteManagerResult>(`/api/admin/managers/${managerId}`, {
    headers: authHeader(token),
  });
  return response.data;
}
