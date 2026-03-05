import mongoose from "mongoose";
import { loadEnv } from "../../config/loadEnv";

export async function connectForDbScript(scriptName: string): Promise<string> {
  const appConfig = loadEnv();
  const mongoUri = appConfig.MONGO_URI;

  await mongoose.connect(mongoUri);
  console.log(`✅ MongoDB connected for ${scriptName} (${appConfig.APP_ENV})`);

  return appConfig.APP_ENV;
}

export async function disconnectDbScript(): Promise<void> {
  await mongoose.disconnect();
  console.log("🔌 MongoDB disconnected");
}

export async function ensureBaseCollectionsAndIndexes(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection is not ready.");
  }

  const existingCollections = new Set(
    (await db.listCollections({}, { nameOnly: true }).toArray()).map(
      (collection) => collection.name
    )
  );

  const requiredCollections = ["users", "products", "orders"];
  for (const collectionName of requiredCollections) {
    if (!existingCollections.has(collectionName)) {
      await db.createCollection(collectionName);
    }
  }

  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("products").createIndex({ name: "text", category: 1 });
  await db.collection("products").createIndex({ productOwnerId: 1 });
  await db
    .collection("products")
    .createIndex({ isFlashSale: 1, flashSaleStartAt: 1, flashSaleEndAt: 1 });
}
