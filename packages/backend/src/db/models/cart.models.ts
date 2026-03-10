import mongoose, { type Types } from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

export const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: { type: [cartItemSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

export const cartModel =
  mongoose.models.Cart ?? mongoose.model("Cart", cartSchema, "carts");

export type CreateCartInput = {
  userId: Types.ObjectId;
  items?: Array<{
    productId: Types.ObjectId;
    quantity: number;
  }>;
};
