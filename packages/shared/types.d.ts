export type UserRole = "guest" | "customer" | "manager" | "admin";

export type AuthUser = {
  id: string;
  role: UserRole;
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
  role: UserRole;
}
