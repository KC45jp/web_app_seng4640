export const UserRole = {
  GUEST: "guest",
  CUSTOMER: "customer",
  MANAGER: "manager",
  ADMIN: "admin",
} as const;

export type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];
export type PersistedUserRoleValue = Exclude<UserRoleValue, typeof UserRole.GUEST>;

export type AuthUser = {
  id: string;
  role: UserRoleValue;
};

export type ApiErrorResponse = {
  message: string;
};

export type PaymentMethod = "credit_card" | "paypal";
export type ProductSortBy = "relevance" | "price" | "createdAt" | "name";
export type SortOrder = "asc" | "desc";

// Auth API
export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResponseUser = {
  id: string;
  name: string;
  email: string;
  role: UserRoleValue;
};

export type RegisterResult = {
  user: AuthResponseUser;
  accessToken: string;
};

export type LoginResult = RegisterResult;

// User API
export type GetMeResult = {
  user: AuthResponseUser;
};

export type UpdateMeInput = {
  name?: string;
  email?: string;
};

export type UpdateMeResult = GetMeResult;

// Product API
export interface Product {
  _id?: string;
  name: string;
  description: string;
  detailedDescription?: string | null;
  price: number;
  flashSalePrice?: number | null;
  category: string;
  stock: number;
  imageUrl: string;
  descriptionImages?: string[];
  isFlashSale: boolean;
  flashSaleStartAt?: string | null;
  flashSaleEndAt?: string | null;
  isActive: boolean;
  productOwnerId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type ListProductsQuery = {
  q?: string;
  search?: string;
  str?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: ProductSortBy;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
};

export type ListProductsResult = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
};

export type GetProductByIdResult = {
  product: Product;
};

// Cart API
export type CartItem = {
  productId: string;
  quantity: number;
};

export type Cart = {
  userId: string;
  items: CartItem[];
  updatedAt?: string;
};

export type AddCartItemInput = {
  productId: string;
  quantity: number;
};

export type UpdateCartItemInput = {
  quantity: number;
};

export type GetCartResult = {
  cart: Cart;
};

export type AddCartItemResult = GetCartResult;
export type UpdateCartItemResult = GetCartResult;
export type RemoveCartItemResult = GetCartResult;

// Checkout/Orders API
export type CheckoutInput = {
  paymentMethod: PaymentMethod;
};

export type OrderStatus = "placed" | "paid" | "shipped" | "completed" | "cancelled";

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  _id?: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus | string;
  createdAt?: string;
  updatedAt?: string;
};

export type CheckoutResult = {
  order: Order;
};

export type ListOrdersResult = {
  items: Order[];
};

export type GetOrderByIdResult = {
  order: Order;
};

// Admin API
export type AdminCreateProductInput = {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: string;
  isFlashSale?: boolean;
};

export type AdminUpdateProductInput = Partial<AdminCreateProductInput>;

export type AdminUpdateFlashSaleInput = {
  isFlashSale: boolean;
  flashSaleStartAt?: string | Date | null;
  flashSaleEndAt?: string | Date | null;
  flashSalePrice?: number | null;
};

export type AdminCreateManagerInput = {
  name: string;
  email: string;
  password: string;
};

export type AdminManagerSummary = {
  id: string;
  name: string;
  email: string;
  role: "manager";
};

export type AdminListManagersResult = {
  items: AdminManagerSummary[];
};

export type AdminListManagedProductsResult = {
  items: Product[];
};

// Generic user shape (for repository/internal mapping when needed)
export interface User {
  _id?: string;
  name: string;
  email: string;
  role: UserRoleValue;
}
