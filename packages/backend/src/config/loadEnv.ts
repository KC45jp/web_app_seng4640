import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

export type AppEnv = "dev" | "stg";

export type AppConfig = {
  readonly APP_ENV: AppEnv;
  readonly PORT: number;
  readonly MONGO_URI: string;
  readonly JWT_SECRET: string | undefined;
  readonly PRODUCT_LIST_LIMIT_MAX: number;
};

let isEnvLoaded = false;
let cachedAppConfig: AppConfig | null = null;

function resolveAppEnv(): AppEnv {
  const requested = process.env.APP_ENV?.trim().toLowerCase();
  return requested === "stg" ? "stg" : "dev";
}

function parseDotenvFile(filePath: string): Record<string, string> {
  return dotenv.parse(fs.readFileSync(filePath));
}

function loadDotenvFiles(appEnv: AppEnv): void {
  const protectedKeys = new Set(Object.keys(process.env));

  const baseEnvPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(baseEnvPath)) {
    applyEnv(parseDotenvFile(baseEnvPath), protectedKeys);
  }

  const envPath = path.resolve(process.cwd(), `.env.${appEnv}`);
  if (fs.existsSync(envPath)) {
    applyEnv(parseDotenvFile(envPath), protectedKeys);
  } else if (appEnv !== "dev") {
    throw new Error(
      `[loadEnv] APP_ENV=${appEnv} but env file was not found: ${envPath}`
    );
  }
}

function applyEnv(
  parsed: Record<string, string>,
  protectedKeys: Set<string>
): void {
  for (const [key, value] of Object.entries(parsed)) {
    if (protectedKeys.has(key)) {
      continue;
    }
    process.env[key] = value;
  }
}

const envSchema = z.object({
  APP_ENV: z.enum(["dev", "stg"]),
  PORT: z.coerce.number().int().min(1).default(5000),
  MONGO_URI: z
    .string()
    .trim()
    .min(1)
    .default("mongodb://localhost:27017/seng4640"),
  JWT_SECRET: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().min(1).optional()
  ),
  PRODUCT_LIST_LIMIT_MAX: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.coerce.number().int().min(1).default(100)
  ),
});

type ParsedEnv = z.infer<typeof envSchema>;

function parseCurrentEnv(appEnv: AppEnv): ParsedEnv {
  return envSchema.parse({
    APP_ENV: appEnv,
    PORT: process.env.PORT,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    PRODUCT_LIST_LIMIT_MAX: process.env.PRODUCT_LIST_LIMIT_MAX,
  });
}

export function loadEnv(): AppConfig {
  if (cachedAppConfig) {
    return cachedAppConfig;
  }

  const appEnv = resolveAppEnv();
  if (!isEnvLoaded) {
    loadDotenvFiles(appEnv);
    isEnvLoaded = true;
  }

  process.env.APP_ENV = appEnv;
  const parsed = parseCurrentEnv(appEnv);
  cachedAppConfig = {
    APP_ENV: parsed.APP_ENV,
    PORT: parsed.PORT,
    MONGO_URI: parsed.MONGO_URI,
    JWT_SECRET: parsed.JWT_SECRET,
    PRODUCT_LIST_LIMIT_MAX: parsed.PRODUCT_LIST_LIMIT_MAX,
  };

  return cachedAppConfig;
}

// Tests can mutate process.env per case and re-parse app config deterministically.
export function resetEnvCacheForTest(): void {
  cachedAppConfig = null;
}
