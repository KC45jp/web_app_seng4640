import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import {
  connectForDbScript,
  disconnectDbScript,
  ensureBaseCollectionsAndIndexes,
} from "./common";

type SeedCustomer = {
  name: string;
  email: string;
  password: string;
};

const CUSTOMER_PASSWORD_SALT_ROUNDS = 10;

const seedCustomer: SeedCustomer = {
  name: "Dev Customer",
  email: "customer@example.com",
  password: "customer123",
};
const seedCustomer2: SeedCustomer = {
  name: "DevDev Customer",
  email: "customer2@example.com",
  password: "customer123",
};
const seedCustomer3: SeedCustomer = {
  name: "DevDevDev Customer",
  email: "customer3@example.com",
  password: "customer123",
};

const seedCustomers: SeedCustomer[] = [
  seedCustomer,
  seedCustomer2,
  seedCustomer3,
];

async function seedCustomerUser(
  customer: SeedCustomer,
  now: Date
): Promise<void> {
  const usersCollection = mongoose.connection.collection("users");
  const email = customer.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(
    customer.password,
    CUSTOMER_PASSWORD_SALT_ROUNDS
  );
  const result = await usersCollection.updateOne(
    { email },
    {
      $set: {
        name: customer.name,
        email,
        passwordHash,
        role: "customer",
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  console.log(
    `👤 Customer seed completed: email=${email}, inserted=${result.upsertedCount ?? 0}, modified=${result.modifiedCount ?? 0}, matched=${result.matchedCount ?? 0}`
  );
}

async function run(): Promise<void> {
  const now = new Date();

  try {
    await connectForDbScript("seed:customer");
    await ensureBaseCollectionsAndIndexes();

    for (const customer of seedCustomers) {
      await seedCustomerUser(customer, now);
    }
  } catch (error) {
    console.error("❌ Customer seed failed:", error);
    process.exitCode = 1;
  } finally {
    await disconnectDbScript();
  }
}

void run();
