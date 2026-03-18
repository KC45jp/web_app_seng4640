import mongoose, { type Types } from "mongoose";
import type { OrderStatus, PaymentMethod } from "@seng4640/shared";

const DB_ORDER_STATUSES = [
  "placed",
  "paid",
  "shipped",
  "completed",
  "cancelled",
] as const satisfies readonly OrderStatus[];

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

export const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) => items.length > 0,
        message: "Order must contain at least one item",
      },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["credit_card", "paypal"] satisfies readonly PaymentMethod[],
    },
    status: {
      type: String,
      required: true,
      enum: DB_ORDER_STATUSES,
      default: "placed",
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export const orderModel =
  mongoose.models.Order ?? mongoose.model("Order", orderSchema, "orders");

export type CreateOrderInput = {
  userId: Types.ObjectId;
  items: Array<{
    productId: Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status?: OrderStatus;
};
