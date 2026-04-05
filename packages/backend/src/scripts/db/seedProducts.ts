import bcrypt from "bcryptjs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  PRODUCT_CATEGORIES,
  UserRole,
  getProductCategoryLabel,
  type AdminCreateProductInput,
  type ProductCategory,
} from "@seng4640/shared";
import type { Logger } from "pino";

import { userModel } from "@/db/models/user.models";
import { createProduct } from "@/modules/admin/service";
import { uploadImage } from "@/modules/images/service";
import { logger } from "@/utils/logger";

import {
  connectForDbScript,
  disconnectDbScript,
  ensureBaseCollectionsAndIndexes,
} from "./common";

const IMAGES_DIR = join(__dirname, "../../../../../db/.images");
const SEED_UPLOADER_ID = "seed-script";
const SEED_PASSWORD_SALT_ROUNDS = 10;

type SeedUserAccount = {
  name: string;
  email: string;
  password: string;
  role: typeof UserRole.MANAGER | typeof UserRole.ADMIN;
};

const seedManagerAccount: SeedUserAccount = {
  name: "Seed Manager",
  email: "seed-manager@example.com",
  password: "manager123",
  role: UserRole.MANAGER,
};

const seedAdminAccount: SeedUserAccount = {
  name: "Seed Admin",
  email: "admin@example.com",
  password: "admin123",
  role: UserRole.ADMIN,
};

const CATEGORY_NAME_THEMES: Record<ProductCategory, string[]> = {
  cpu: ["X86", "X64", "ARM", "Intel", "AMD", "Zen", "Ryzen", "Core"],
  gpu: ["CUDA", "Radeon", "GeForce", "Arc", "RDNA", "Turing", "Tensor", "Pixel"],
  motherboard: ["ATX", "MicroATX", "MiniITX", "Socket", "Chipset", "Backplane", "Northbridge", "Southbridge"],
  memory: ["DDR4", "DDR5", "LPDDR5", "ECC", "Kingston", "Corsair", "HyperX", "Trident"],
  storage: ["NVMe", "SATA", "Optane", "Barracuda", "IronWolf", "Crucial", "Evo", "Aorus"],
  "power-supply": ["Bronze", "Gold", "Platinum", "Titanium", "Seasonic", "Corsair", "Modular", "Silent"],
  case: ["Falcon", "Raven", "Panther", "Lynx", "Atlas", "Nova", "Forge", "Vector"],
  cooling: ["Frost", "Blizzard", "Vortex", "Kraken", "Noctua", "Glacier", "Aero", "Boreal"],
};

async function seedUserAccount(
  account: SeedUserAccount,
  scriptLogger: Logger
): Promise<{ id: string; email: string }> {
  const email = account.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(account.password, SEED_PASSWORD_SALT_ROUNDS);

  const user = await userModel
    .findOneAndUpdate(
      { email },
      {
        $set: {
          name: account.name.trim(),
          email,
          passwordHash,
          role: account.role,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    )
    .lean();

  if (!user?._id) {
    throw new Error(`Failed to seed user account for ${email}`);
  }

  const userId = user._id.toString();
  scriptLogger.info(
    { userId, email, role: account.role },
    "Seed user account ensured"
  );

  return {
    id: userId,
    email,
  };
}

function buildPlaceholderImageUrls(): string[] {
  return PRODUCT_CATEGORIES.map((category) => {
    const label = getProductCategoryLabel(category);
    return `https://placehold.co/800x800/png?text=${encodeURIComponent(label)}`;
  });
}

function getSeedImageInstruction(): string {
  return [
    "Populate db/.images with PNG or JPG seed files before building the staging backend image.",
    "Then redeploy with ./stg_server_start and rerun ./stg_db_reset_standard to reseed products with real images.",
  ].join(" ");
}

function buildSeedProductName(
  category: ProductCategory,
  globalIndex: number,
  categoryOccurrence: number
): string {
  const themeNames = CATEGORY_NAME_THEMES[category];
  const baseName = themeNames[categoryOccurrence % themeNames.length];
  return `${baseName} ${globalIndex}`;
}

async function uploadSeedImages(scriptLogger: Logger): Promise<string[]> {
  let files: string[];
  try {
    files = (await readdir(IMAGES_DIR)).filter((f) =>
      /\.(jpg|jpeg|png)$/i.test(f)
    );
  } catch {
    const placeholderUrls = buildPlaceholderImageUrls();
    scriptLogger.warn(
      {
        imagesDir: IMAGES_DIR,
        placeholderCount: placeholderUrls.length,
        instruction: getSeedImageInstruction(),
      },
      "Images directory not found, using placeholder image URLs for seed"
    );
    return placeholderUrls;
  }

  if (files.length === 0) {
    const placeholderUrls = buildPlaceholderImageUrls();
    scriptLogger.warn(
      {
        imagesDir: IMAGES_DIR,
        placeholderCount: placeholderUrls.length,
        instruction: getSeedImageInstruction(),
      },
      "No image files found, using placeholder image URLs for seed"
    );
    return placeholderUrls;
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
  const categoryOccurrences = Object.fromEntries(
    PRODUCT_CATEGORIES.map((category) => [category, 0])
  ) as Record<ProductCategory, number>;

  for (let i = 1; i <= count; i += 1) {
    const category = PRODUCT_CATEGORIES[(i - 1) % PRODUCT_CATEGORIES.length];
    const categoryLabel = getProductCategoryLabel(category);
    const productName = buildSeedProductName(category, i, categoryOccurrences[category]);
    categoryOccurrences[category] += 1;

    products.push({
      name: productName,
      description: `Development seed product ${productName} in the ${categoryLabel} category.`,
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

    const manager = await seedUserAccount(seedManagerAccount, scriptLogger);
    const admin = await seedUserAccount(seedAdminAccount, scriptLogger);
    const managerId = manager.id;
    scriptLogger.info({ managerId }, "Seed manager ensured");
    scriptLogger.info({ adminId: admin.id, email: admin.email }, "Seed admin ensured");

    const imageUrls = await uploadSeedImages(scriptLogger);
    const products = buildProducts(50, imageUrls);

    for (const product of products) {
      await createProduct(managerId, product, scriptLogger);
    }

    console.log(
      `🌱 Product seed completed: processed=${products.length}, manager=${manager.email}, admin=${admin.email}`
    );
  } catch (error) {
    console.error("❌ Product seed failed:", error);
    process.exitCode = 1;
  } finally {
    await disconnectDbScript();
  }
}

void run();
