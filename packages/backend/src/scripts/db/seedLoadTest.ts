import bcrypt from "bcryptjs";
import mongoose, { Types } from "mongoose";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  PRODUCT_CATEGORIES,
  UserRole,
  getProductCategoryLabel,
  isProductCategory,
  type ProductCategory,
} from "@seng4640/shared";

import { productModel } from "@/db/models/product.models";
import { userModel } from "@/db/models/user.models";
import { logger } from "@/utils/logger";

import {
  connectForDbScript,
  disconnectDbScript,
  ensureBaseCollectionsAndIndexes,
} from "./common";

const DEFAULT_USER_COUNT = 200;
const DEFAULT_EMAIL_PREFIX = "loadtest";
const DEFAULT_EMAIL_DOMAIN = "example.com";
const DEFAULT_CUSTOMER_PASSWORD = "loadtest123";
const DEFAULT_PRODUCT_NAME = "[Load Test] Flash Sale Checkout Product";
const DEFAULT_PRODUCT_DESCRIPTION =
  "Disposable staging product used to validate checkout oversell protection.";
const DEFAULT_PRODUCT_IMAGE_URL =
  "https://placehold.co/600x600/png?text=Load+Test";
const DEFAULT_PRODUCT_CATEGORY: ProductCategory = "storage";
const DEFAULT_PRODUCT_PRICE = 99.99;
const DEFAULT_FLASH_SALE_PRICE = 19.99;
const DEFAULT_FLASH_SALE_DURATION_HOURS = 12;
const DEFAULT_MANAGER_NAME = "Seed Manager";
const DEFAULT_MANAGER_EMAIL = "seed-manager@example.com";
const DEFAULT_MANAGER_PASSWORD = "manager123";
const DEFAULT_ADMIN_NAME = "Seed Admin";
const DEFAULT_ADMIN_EMAIL = "admin@example.com";
const DEFAULT_ADMIN_PASSWORD = "admin123";
const PASSWORD_SALT_ROUNDS = 10;
const ARTIFACTS_DIR = join(__dirname, "../../../../../artifacts/loadtest");

type SeedAccount = {
  email: string;
  name: string;
  password: string;
  role: typeof UserRole.MANAGER | typeof UserRole.ADMIN;
};

function readPositiveIntEnv(key: string, fallback: number): number {
  const rawValue = process.env[key]?.trim();
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${key} must be a positive integer`);
  }

  return parsed;
}

function readNonNegativeNumberEnv(key: string, fallback: number): number {
  const rawValue = process.env[key]?.trim();
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${key} must be a non-negative number`);
  }

  return parsed;
}

function readStringEnv(key: string, fallback: string): string {
  const rawValue = process.env[key]?.trim();
  return rawValue && rawValue.length > 0 ? rawValue : fallback;
}

function readProductCategoryEnv(
  key: string,
  fallback: ProductCategory
): ProductCategory {
  const rawValue = process.env[key]?.trim();
  if (!rawValue) {
    return fallback;
  }

  if (!isProductCategory(rawValue)) {
    throw new Error(
      `${key} must be one of: ${PRODUCT_CATEGORIES.join(", ")}`
    );
  }

  return rawValue;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildLoadTestEmail(prefix: string, domain: string, index: number): string {
  return `${prefix}+${String(index).padStart(3, "0")}@${domain}`;
}

async function ensurePrivilegedAccount(account: SeedAccount): Promise<Types.ObjectId> {
  const passwordHash = await bcrypt.hash(account.password, PASSWORD_SALT_ROUNDS);

  const user = await userModel
    .findOneAndUpdate(
      { email: account.email.trim().toLowerCase() },
      {
        $set: {
          name: account.name.trim(),
          email: account.email.trim().toLowerCase(),
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
    throw new Error(`Failed to ensure privileged account for ${account.email}`);
  }

  return user._id;
}

async function cleanupPreviousLoadTestData(
  emailPrefix: string,
  emailDomain: string,
  productName: string
): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection is not ready.");
  }

  const emailPattern = `^${escapeRegExp(emailPrefix)}\\+\\d+@${escapeRegExp(emailDomain)}$`;
  const previousUsers = await db
    .collection("users")
    .find(
      { email: { $regex: emailPattern, $options: "i" } },
      { projection: { _id: 1 } }
    )
    .toArray();

  const previousUserIds = previousUsers.map((user) => user._id as Types.ObjectId);
  if (previousUserIds.length > 0) {
    await db.collection("orders").deleteMany({ userId: { $in: previousUserIds } });
    await db.collection("carts").deleteMany({ userId: { $in: previousUserIds } });
    await db.collection("users").deleteMany({ _id: { $in: previousUserIds } });
  }

  const previousProducts = await db
    .collection("products")
    .find({ name: productName }, { projection: { _id: 1 } })
    .toArray();
  const previousProductIds = previousProducts.map(
    (product) => product._id as Types.ObjectId
  );

  if (previousProductIds.length > 0) {
    await db
      .collection("carts")
      .deleteMany({ "items.productId": { $in: previousProductIds } });
    await db
      .collection("orders")
      .deleteMany({ "items.productId": { $in: previousProductIds } });
    await db.collection("products").deleteMany({ _id: { $in: previousProductIds } });
  }
}

async function writeArtifacts(input: {
  appEnv: string;
  customerPassword: string;
  flashSalePrice: number;
  productCategory: ProductCategory;
  productId: string;
  productName: string;
  productStock: number;
  summaryPath: string;
  userCount: number;
  usersCsvPath: string;
  users: Array<{ email: string; paymentMethod: "credit_card" }>;
}): Promise<void> {
  await mkdir(ARTIFACTS_DIR, { recursive: true });

  const csvBody = [
    "email,password,paymentMethod",
    ...input.users.map(
      (user) => `${user.email},${input.customerPassword},${user.paymentMethod}`
    ),
  ].join("\n");
  await writeFile(input.usersCsvPath, `${csvBody}\n`, "utf8");

  const summary = {
    generatedAt: new Date().toISOString(),
    appEnv: input.appEnv,
    userCount: input.userCount,
    product: {
      id: input.productId,
      name: input.productName,
      category: input.productCategory,
      categoryLabel: getProductCategoryLabel(input.productCategory),
      stock: input.productStock,
      flashSalePrice: input.flashSalePrice,
    },
    usersCsvPath: input.usersCsvPath,
    routes: {
      login: "/api/auth/login",
      checkout: "/api/checkout",
    },
  };
  await writeFile(
    input.summaryPath,
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8"
  );
}

async function run(): Promise<void> {
  const scriptLogger = logger.child({ module: "seed-loadtest-script" });
  const userCount = readPositiveIntEnv("LOADTEST_USER_COUNT", DEFAULT_USER_COUNT);
  const productStock = readPositiveIntEnv("LOADTEST_PRODUCT_STOCK", userCount);
  const flashSaleDurationHours = readPositiveIntEnv(
    "LOADTEST_FLASH_SALE_DURATION_HOURS",
    DEFAULT_FLASH_SALE_DURATION_HOURS
  );
  const emailPrefix = readStringEnv("LOADTEST_EMAIL_PREFIX", DEFAULT_EMAIL_PREFIX);
  const emailDomain = readStringEnv("LOADTEST_EMAIL_DOMAIN", DEFAULT_EMAIL_DOMAIN);
  const customerPassword = readStringEnv(
    "LOADTEST_CUSTOMER_PASSWORD",
    DEFAULT_CUSTOMER_PASSWORD
  );
  const productName = readStringEnv("LOADTEST_PRODUCT_NAME", DEFAULT_PRODUCT_NAME);
  const productDescription = readStringEnv(
    "LOADTEST_PRODUCT_DESCRIPTION",
    DEFAULT_PRODUCT_DESCRIPTION
  );
  const productImageUrl = readStringEnv(
    "LOADTEST_PRODUCT_IMAGE_URL",
    DEFAULT_PRODUCT_IMAGE_URL
  );
  const productCategory = readProductCategoryEnv(
    "LOADTEST_PRODUCT_CATEGORY",
    DEFAULT_PRODUCT_CATEGORY
  );
  const productPrice = readNonNegativeNumberEnv(
    "LOADTEST_PRODUCT_PRICE",
    DEFAULT_PRODUCT_PRICE
  );
  const flashSalePrice = readNonNegativeNumberEnv(
    "LOADTEST_FLASH_SALE_PRICE",
    DEFAULT_FLASH_SALE_PRICE
  );
  const managerAccount: SeedAccount = {
    name: DEFAULT_MANAGER_NAME,
    email: DEFAULT_MANAGER_EMAIL,
    password: DEFAULT_MANAGER_PASSWORD,
    role: UserRole.MANAGER,
  };
  const adminAccount: SeedAccount = {
    name: DEFAULT_ADMIN_NAME,
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
    role: UserRole.ADMIN,
  };

  try {
    const appEnv = await connectForDbScript("seed:loadtest");
    await ensureBaseCollectionsAndIndexes();
    await cleanupPreviousLoadTestData(emailPrefix, emailDomain, productName);

    const [managerId] = await Promise.all([
      ensurePrivilegedAccount(managerAccount),
      ensurePrivilegedAccount(adminAccount),
    ]);

    const now = new Date();
    const flashSaleStartAt = new Date(now.getTime() - 5 * 60 * 1000);
    const flashSaleEndAt = new Date(
      now.getTime() + flashSaleDurationHours * 60 * 60 * 1000
    );

    const loadTestProduct = await productModel.create({
      name: productName,
      description: productDescription,
      price: Number(productPrice.toFixed(2)),
      flashSalePrice: Number(flashSalePrice.toFixed(2)),
      stock: productStock,
      imageUrl: productImageUrl,
      category: productCategory,
      productOwnerId: managerId,
      isFlashSale: true,
      isActive: true,
      flashSaleStartAt,
      flashSaleEndAt,
    });

    const customerPasswordHash = await bcrypt.hash(
      customerPassword,
      PASSWORD_SALT_ROUNDS
    );
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("MongoDB connection is not ready.");
    }

    const usersCollection = db.collection("users");
    const cartsCollection = db.collection("carts");
    const users: Array<{ _id: Types.ObjectId; email: string }> = [];

    for (let index = 1; index <= userCount; index += 1) {
      const userId = new Types.ObjectId();
      users.push({
        _id: userId,
        email: buildLoadTestEmail(emailPrefix, emailDomain, index),
      });
    }

    await usersCollection.insertMany(
      users.map((user, index) => ({
        _id: user._id,
        name: `Load Test Customer ${String(index + 1).padStart(3, "0")}`,
        email: user.email,
        role: UserRole.CUSTOMER,
        passwordHash: customerPasswordHash,
        createdAt: now,
        updatedAt: now,
      }))
    );

    await cartsCollection.insertMany(
      users.map((user) => ({
        _id: new Types.ObjectId(),
        userId: user._id,
        items: [
          {
            productId: loadTestProduct._id,
            quantity: 1,
          },
        ],
        __v: 0,
        createdAt: now,
        updatedAt: now,
      }))
    );

    const artifactPrefix = `${appEnv}-loadtest`;
    const usersCsvPath = join(ARTIFACTS_DIR, `${artifactPrefix}-users.csv`);
    const summaryPath = join(ARTIFACTS_DIR, `${artifactPrefix}-summary.json`);
    await writeArtifacts({
      appEnv,
      customerPassword,
      flashSalePrice: Number(flashSalePrice.toFixed(2)),
      productCategory,
      productId: loadTestProduct._id.toString(),
      productName,
      productStock,
      summaryPath,
      userCount,
      usersCsvPath,
      users: users.map((user) => ({
        email: user.email,
        paymentMethod: "credit_card",
      })),
    });

    scriptLogger.info(
      {
        appEnv,
        productId: loadTestProduct._id.toString(),
        productStock,
        userCount,
        usersCsvPath,
        summaryPath,
      },
      "Load-test staging seed completed"
    );
    console.log(
      [
        "🌱 Load-test seed completed",
        `env=${appEnv}`,
        `users=${userCount}`,
        `stock=${productStock}`,
        `productId=${loadTestProduct._id.toString()}`,
        `usersCsv=${usersCsvPath}`,
        `summary=${summaryPath}`,
      ].join(" | ")
    );
  } catch (error) {
    console.error("❌ Load-test seed failed:", error);
    process.exitCode = 1;
  } finally {
    await disconnectDbScript();
  }
}

void run();
