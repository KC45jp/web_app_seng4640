import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

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

function loadDotenvFiles(appEnv: AppEnv): void {
  const baseEnvPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(baseEnvPath)) {
    const parsed = dotenv.parse(fs.readFileSync(baseEnvPath));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }

  const envPath = path.resolve(process.cwd(), `.env.${appEnv}`);
  if (fs.existsSync(envPath)) {
    const parsed = dotenv.parse(fs.readFileSync(envPath));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } else if (appEnv !== "dev") {
    throw new Error(
      `[loadEnv] APP_ENV=${appEnv} but env file was not found: ${envPath}`
    );
  }

}

function parseNumberFromEnv(
  key: string,
  fallback: number,
  minValue: number
): number {
  const raw = process.env[key];
  if (!raw || raw.trim().length === 0) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < minValue) {
    throw new Error(`[loadEnv] ${key} must be an integer >= ${minValue}`);
  }

  return parsed;
}

export function loadEnv(): AppConfig {
  const appEnv = resolveAppEnv();

  if (!isEnvLoaded) {
    loadDotenvFiles(appEnv);
    isEnvLoaded = true;
  }

  process.env.APP_ENV = appEnv;

  if (!cachedAppConfig) {
    cachedAppConfig = {
      get APP_ENV(): AppEnv {
        return resolveAppEnv();
      },
      get PORT(): number {
        return parseNumberFromEnv("PORT", 5000, 1);
      },
      get MONGO_URI(): string {
        const mongoUri = process.env.MONGO_URI?.trim();
        return mongoUri && mongoUri.length > 0
          ? mongoUri
          : "mongodb://localhost:27017/seng4640";
      },
      get JWT_SECRET(): string | undefined {
        const secret = process.env.JWT_SECRET?.trim();
        return secret && secret.length > 0 ? secret : undefined;
      },
      get PRODUCT_LIST_LIMIT_MAX(): number {
        return parseNumberFromEnv("PRODUCT_LIST_LIMIT_MAX", 100, 1);
      },
    };
  }

  return cachedAppConfig;
}
