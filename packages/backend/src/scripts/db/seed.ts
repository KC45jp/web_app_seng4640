import mongoose, { Types } from "mongoose";
import {
  connectForDbScript,
  disconnectDbScript,
  ensureBaseCollectionsAndIndexes,
} from "./common";

type ProductCategory =
  | "apparel"
  | "electronics"
  | "home"
  | "outdoor"
  | "books";

type ProductSeed = {
  name: string;
  description: string;
  detailedDescription: string | null;
  price: number;
  flashSalePrice: number | null;
  stock: number;
  imageUrl: string;
  descriptionImages: string[];
  category: ProductCategory;
  productOwnerId: Types.ObjectId | null;
  specs: {
    sizeCm: {
      depth: number;
      width: number;
      height: number;
    } | null;
    weightG: number | null;
    extra: Record<string, string | number | boolean | null>;
  };
  isFlashSale: boolean;
  flashSaleStartAt: Date | null;
  flashSaleEndAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const categories: ProductCategory[] = [
  "apparel",
  "electronics",
  "home",
  "outdoor",
  "books",
];

function buildProducts(count: number): ProductSeed[] {
  const now = new Date();
  const products: ProductSeed[] = [];

  for (let i = 1; i <= count; i += 1) {
    const category = categories[(i - 1) % categories.length];
    const isFlashSale = i % 7 === 0;
    const price = Number((9.99 + i * 1.75).toFixed(2));
    const flashSalePrice = isFlashSale ? Number((price * 0.85).toFixed(2)) : null;
    const stock = 10 + ((i * 3) % 90);
    const flashSaleStartAt = isFlashSale
      ? new Date(now.getTime() - 60 * 60 * 1000)
      : null;
    const flashSaleEndAt = isFlashSale
      ? new Date(now.getTime() + 24 * 60 * 60 * 1000)
      : null;

    products.push({
      name: `Product ${i}`,
      description: `Development seed product ${i} in ${category} category.`,
      detailedDescription:
        i % 4 === 0
          ? null
          : `Detailed info for Product ${i}. Materials, care instructions, and usage notes.`,
      price,
      flashSalePrice,
      stock,
      imageUrl: `/images/p${i}.jpg`,
      descriptionImages: [`/images/p${i}.jpg`, `/images/p${(i % count) + 1}.jpg`],
      category,
      productOwnerId: null,
      specs: {
        sizeCm: null,
        weightG: null,
        extra: {},
      },
      isFlashSale,
      flashSaleStartAt,
      flashSaleEndAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  return products;
}

async function run(): Promise<void> {
  try {
    await connectForDbScript("seed");
    await ensureBaseCollectionsAndIndexes();

    const products = buildProducts(50);
    const collection = mongoose.connection.collection("products");

    const operations = products.map((product) => ({
      updateOne: {
        filter: { name: product.name },
        update: {
          $set: {
            description: product.description,
            detailedDescription: product.detailedDescription,
            price: product.price,
            flashSalePrice: product.flashSalePrice,
            stock: product.stock,
            imageUrl: product.imageUrl,
            descriptionImages: product.descriptionImages,
            category: product.category,
            productOwnerId: product.productOwnerId,
            specs: product.specs,
            isFlashSale: product.isFlashSale,
            flashSaleStartAt: product.flashSaleStartAt,
            flashSaleEndAt: product.flashSaleEndAt,
            updatedAt: product.updatedAt,
          },
          $setOnInsert: {
            name: product.name,
            createdAt: product.createdAt,
          },
        },
        upsert: true,
      },
    }));

    const result = await collection.bulkWrite(operations, { ordered: false });
    console.log(
      `🌱 Product seed completed: inserted=${result.upsertedCount}, modified=${result.modifiedCount}, matched=${result.matchedCount}`
    );
  } catch (error) {
    console.error("❌ Product seed failed:", error);
    process.exitCode = 1;
  } finally {
    await disconnectDbScript();
  }
}

void run();
