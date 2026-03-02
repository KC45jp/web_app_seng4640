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
