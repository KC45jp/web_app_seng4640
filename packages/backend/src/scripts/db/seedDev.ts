import mongoose, { Types } from "mongoose";
import {
  connectForDbScript,
  disconnectDbScript,
  ensureBaseCollectionsAndIndexes,
} from "./common";

type DevUser = {
  name: string;
  email: string;
  role: "customer" | "manager" | "admin";
  passwordHash: string;
};

type DevProduct = {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: string;
  isFlashSale: boolean;
};

type SeedOrderItem = {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
};

const devUsers: DevUser[] = [
  {
    name: "Dev Customer",
    email: "customer@example.com",
    role: "customer",
    passwordHash:
      "$2b$10$s7g0InZy5UQ9vwIlrkxEdu1uvcjY5sK.S8xFVDmk677l2ts3V1xlW", // customer123
  },
  {
    name: "Dev Manager",
    email: "manager@example.com",
    role: "manager",
    passwordHash:
      "$2b$10$lS/uW5EoKM2.cUunQX48fOjlnmFgmmTscf3Yyde.iokqeYoytYaB2", // manager123
  },
  {
    name: "Dev Admin",
    email: "admin@example.com",
    role: "admin",
    passwordHash:
      "$2b$10$IHx/mEzM2o8tAxq2hgTPHu82QXCPoL.hgghO0VANV8dBZAq9pdObe", // admin123
  },
];

const devProducts: DevProduct[] = [
  {
    name: "Basic White T-Shirt",
    description: "Minimal cotton t-shirt for everyday use.",
    price: 19.99,
    stock: 120,
    imageUrl: "/images/p1.jpg",
    category: "apparel",
    isFlashSale: false,
  },
  {
    name: "Flash Deal Sneakers",
    description: "Lightweight sneakers with limited stock flash sale.",
    price: 49.99,
    stock: 25,
    imageUrl: "/images/p2.jpg",
    category: "shoes",
    isFlashSale: true,
  },
  {
    name: "Ceramic Coffee Mug",
    description: "350ml mug for home office setup.",
    price: 12.5,
    stock: 80,
    imageUrl: "/images/p3.jpg",
    category: "home",
    isFlashSale: false,
  },
  {
    name: "Mechanical Keyboard",
    description: "Compact keyboard with tactile switches.",
    price: 79.0,
    stock: 35,
    imageUrl: "/images/p4.jpg",
    category: "electronics",
    isFlashSale: true,
  },
  {
    name: "Reusable Water Bottle",
    description: "750ml stainless steel bottle.",
    price: 24.0,
    stock: 60,
    imageUrl: "/images/p5.jpg",
    category: "outdoor",
    isFlashSale: false,
  },
];

async function seedUsers(now: Date): Promise<void> {
  const usersCollection = mongoose.connection.collection("users");
  const operations = devUsers.map((user) => ({
    updateOne: {
      filter: { email: user.email },
      update: {
        $set: { ...user, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      upsert: true,
    },
  }));

  const result = await usersCollection.bulkWrite(operations, { ordered: false });
  console.log(
    `👤 User seed completed: inserted=${result.upsertedCount}, modified=${result.modifiedCount}, matched=${result.matchedCount}`
  );
}

async function run(): Promise<void> {
  const now = new Date();

  try {
    await connectForDbScript("seed:dev");
    await ensureBaseCollectionsAndIndexes();

    await seedUsers(now);
  } catch (error) {
    console.error("❌ Dev seed failed:", error);
    process.exitCode = 1;
  } finally {
    await disconnectDbScript();
  }
}

void run();
