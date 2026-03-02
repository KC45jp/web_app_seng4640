import mongoose from "mongoose";
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
  price: number;
  stock: number;
  imageUrl: string;
  category: ProductCategory;
  isFlashSale: boolean;
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
    const stock = 10 + ((i * 3) % 90);

    products.push({
      name: `Product ${i}`,
      description: `Development seed product ${i} in ${category} category.`,
      price,
      stock,
      imageUrl: `/images/p${i}.jpg`,
      category,
      isFlashSale,
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
            price: product.price,
            stock: product.stock,
            imageUrl: product.imageUrl,
            category: product.category,
            isFlashSale: product.isFlashSale,
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
