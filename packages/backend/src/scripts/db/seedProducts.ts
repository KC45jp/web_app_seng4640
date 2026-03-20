import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import type { AdminCreateProductInput } from "@seng4640/shared";
import type { Logger } from "pino";

import { createSeedProduct } from "@/modules/admin/service";
import { uploadImage } from "@/modules/images/service";
import { logger } from "@/utils/logger";

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

const categories: ProductCategory[] = [
  "apparel",
  "electronics",
  "home",
  "outdoor",
  "books",
];

const IMAGES_DIR = join(__dirname, "../../../../../db/.images");
const SEED_UPLOADER_ID = "seed-script";

async function uploadSeedImages(scriptLogger: Logger): Promise<string[]> {
  let files: string[];
  try {
    files = (await readdir(IMAGES_DIR)).filter((f) =>
      /\.(jpg|jpeg|png)$/i.test(f)
    );
  } catch {
    throw new Error(`Images directory not found: ${IMAGES_DIR}`);
  }

  if (files.length === 0) {
    throw new Error(`No image files found in: ${IMAGES_DIR}`);
  }

  const urls: string[] = [];
  for (const file of files.sort()) {
    const buffer = await readFile(join(IMAGES_DIR, file));
    const contentType = /\.png$/i.test(file) ? "image/png" : "image/jpeg";
    const result = await uploadImage(
      {
        buffer,
        contentType,
        originalName: file,
        uploaderId: SEED_UPLOADER_ID,
      },
      scriptLogger
    );
    urls.push(result.url);
    scriptLogger.debug({ file, url: result.url }, "Seed image uploaded");
  }
  return urls;
}

function buildProducts(
  count: number,
  imageUrls: string[]
): AdminCreateProductInput[] {
  const products: AdminCreateProductInput[] = [];

  for (let i = 1; i <= count; i += 1) {
    const category = categories[(i - 1) % categories.length];

    products.push({
      name: `Product ${i}`,
      description: `Development seed product ${i} in ${category} category.`,
      price: Number((9.99 + i * 1.75).toFixed(2)),
      stock: 10 + ((i * 3) % 90),
      imageUrl: imageUrls[(i - 1) % imageUrls.length],
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

    const imageUrls = await uploadSeedImages(scriptLogger);
    const products = buildProducts(50, imageUrls);

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
