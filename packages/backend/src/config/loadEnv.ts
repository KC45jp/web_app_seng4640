import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

type AppEnv = "dev" | "stg";

export function loadEnv(): AppEnv {
  const requested = process.env.APP_ENV?.trim().toLowerCase();
  const appEnv: AppEnv = requested === "stg" ? "stg" : "dev";

  const baseEnvPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(baseEnvPath)) {
    dotenv.config({ path: baseEnvPath });
  }

  const envPath = path.resolve(process.cwd(), `.env.${appEnv}`);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  } else if (appEnv !== "dev") {
    throw new Error(
      `[loadEnv] APP_ENV=${appEnv} but env file was not found: ${envPath}`
    );
  }

  process.env.APP_ENV = appEnv;
  return appEnv;
}
