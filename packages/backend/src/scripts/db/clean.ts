import mongoose from "mongoose";
import { connectForDbScript, disconnectDbScript } from "./common";

const TARGET_COLLECTIONS = [
  "carts",
  "orders",
  "products",
  "users",
  "product-images.files",
  "product-images.chunks",
] as const;

async function run(): Promise<void> {
  try {
    await connectForDbScript("db:clean");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("MongoDB connection is not ready.");
    }

    const existingCollections = new Set(
      (await db.listCollections({}, { nameOnly: true }).toArray()).map(
        (collection) => collection.name
      )
    );

    for (const collectionName of TARGET_COLLECTIONS) {
      if (!existingCollections.has(collectionName)) {
        continue;
      }

      const result = await db.collection(collectionName).deleteMany({});
      console.log(`🧹 ${collectionName}: deleted=${result.deletedCount ?? 0}`);
    }

    console.log("✅ DB clean completed");
  } catch (error) {
    console.error("❌ DB clean failed:", error);
    process.exitCode = 1;
  } finally {
    await disconnectDbScript();
  }
}

void run();
