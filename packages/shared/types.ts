// ユーザーロールの定義 (Req_1.1)
export type UserRole = 'guest' | 'customer' | 'manager' | 'admin';

// 商品データの定義 (Req_2.2, 2.4)
export interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  isFlashSale: boolean; // (Req_8.1)
  saleStartTime?: string;
}

// ユーザーの定義
export interface User {
  _id?: string;
  username: string;
  email: string;
  role: UserRole;
}