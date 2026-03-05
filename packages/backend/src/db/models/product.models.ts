import mongoose, { type Types } from "mongoose";

const productSizeSchema = new mongoose.Schema(
  {
    depth: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, min: 0 },
    height: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const productSpecsSchema = new mongoose.Schema(
  {
    sizeCm: { type: productSizeSchema, default: null },
    weightG: { type: Number, min: 0, default: null },
    extra: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

export const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    detailedDescription: { type: String, default: null },
    price: { type: Number, required: true, min: 0 },
    flashSalePrice: { type: Number, min: 0, default: null },
    stock: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, required: true, trim: true },
    descriptionImages: { type: [String], default: [] },
    category: { type: String, required: true, trim: true },
    productOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    specs: {
      type: productSpecsSchema,
      default: () => ({
        sizeCm: null,
        weightG: null,
        extra: {},
      }),
    },
    isFlashSale: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
    flashSaleStartAt: { type: Date, default: null },
    flashSaleEndAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export const productModel =
  mongoose.models.Product ?? mongoose.model("Product", productSchema, "products");

export type ProductSpecsExtraValue = string | number | boolean | null;

export type CreateProductInput = {
  name: string;
  description: string;
  detailedDescription?: string | null;
  price: number;
  flashSalePrice?: number | null;
  stock: number;
  imageUrl: string;
  descriptionImages?: string[];
  category: string;
  productOwnerId?: Types.ObjectId | null;
  specs?: {
    sizeCm?: {
      depth: number;
      width: number;
      height: number;
    } | null;
    weightG?: number | null;
    extra?: Record<string, ProductSpecsExtraValue>;
  };
  isFlashSale?: boolean;
  isActive?: boolean;
  flashSaleStartAt?: Date | null;
  flashSaleEndAt?: Date | null;
};
