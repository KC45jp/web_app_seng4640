import type { AdminCreateProductInput } from "@seng4640/shared";

import { createSeedProduct } from "@/modules/admin/service";
import {
  connectForDbScript,
  disconnectDbScript,
  ensureBaseCollectionsAndIndexes,
} from "./common";
import { logger } from "@/utils/logger";

type ProductCategory =
  | "apparel"
  | "electronics"
  | "home"
  | "outdoor"
  | "books";

const categories: ProductCategory[] = [
  "apparel",
  "electronics",
  "home",
  "outdoor",
  "books",
];

function buildProducts(count: number): AdminCreateProductInput[] {
  const products: AdminCreateProductInput[] = [];

  for (let i = 1; i <= count; i += 1) {
    const category = categories[(i - 1) % categories.length];

    products.push({
      name: `Product ${i}`,
      description: `Development seed product ${i} in ${category} category.`,
      price: Number((9.99 + i * 1.75).toFixed(2)),
      stock: 10 + ((i * 3) % 90),
      imageUrl: `/images/p${i}.jpg`,
      category,
      isFlashSale: i % 7 === 0,
    });
  }

  return products;
}

async function run(): Promise<void> {
  const scriptLogger = logger.child({ module: "seed-products-script" });

  try {
    await connectForDbScript("seed:products");
    await ensureBaseCollectionsAndIndexes();

    const products = buildProducts(50);

    for (const product of products) {
      await createSeedProduct(product, scriptLogger);
    }

    console.log(`🌱 Product seed completed: processed=${products.length}`);
  } catch (error) {
    console.error("❌ Product seed failed:", error);
    process.exitCode = 1;
  } finally {
    await disconnectDbScript();
  }
}

void run();
