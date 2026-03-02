export const UserRole = {
  GUEST: "guest",
  CUSTOMER: "customer",
  MANAGER: "manager",
  ADMIN: "admin",
} as const;

export type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];

export type AuthUser = {
  id: string;
  role: UserRoleValue;
};

export interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  isFlashSale: boolean;
  saleStartTime?: string;
}

export interface User {
  _id?: string;
  username: string;
  email: string;
  role: UserRoleValue;
}
