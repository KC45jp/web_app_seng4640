export type AppEnv = "dev" | "stg";

// Enum-like env key registry. Keep aligned with backend .env files.
export const EnvKeys = {
  APP_ENV: "APP_ENV",
  PORT: "PORT",
  MONGO_URI: "MONGO_URI",
  JWT_SECRET: "JWT_SECRET",
  LOG_LEVEL: "LOG_LEVEL",
  PRODUCT_LIST_LIMIT_MAX: "PRODUCT_LIST_LIMIT_MAX",
} as const;

export type EnvKeyName = keyof typeof EnvKeys;
export type EnvKey = (typeof EnvKeys)[EnvKeyName];

export type AppConfig = {
  readonly APP_ENV: AppEnv;
  readonly PORT: number;
  readonly MONGO_URI: string;
  readonly JWT_SECRET: string | undefined;
  readonly PRODUCT_LIST_LIMIT_MAX: number;
};

export type EnvSource = Partial<Record<EnvKey, string | undefined>>;

function normalizeEnvString(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolveAppEnv(source: EnvSource): AppEnv {
  const requested = normalizeEnvString(source.APP_ENV)?.toLowerCase();
  return requested === "stg" ? "stg" : "dev";
}

function readRequiredString(source: EnvSource, key: EnvKey): string {
  const value = normalizeEnvString(source[key]);
  if (!value) {
    throw new Error(`[loadEnv] Missing env value: ${key}`);
  }
  return value;
}

function readOptionalString(source: EnvSource, key: EnvKey): string | undefined {
  return normalizeEnvString(source[key]);
}

function readRequiredPositiveInt(source: EnvSource, key: EnvKey): number {
  const raw = readRequiredString(source, key);
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`[loadEnv] Invalid positive integer env value: ${key}`);
  }
  return parsed;
}

function buildAppConfigFromSource(source: EnvSource): AppConfig {
  const appEnv = resolveAppEnv(source);

  return {
    APP_ENV: appEnv,
    PORT: readRequiredPositiveInt(source, EnvKeys.PORT),
    MONGO_URI: readRequiredString(source, EnvKeys.MONGO_URI),
    JWT_SECRET: readOptionalString(source, EnvKeys.JWT_SECRET),
    PRODUCT_LIST_LIMIT_MAX: readRequiredPositiveInt(
      source,
      EnvKeys.PRODUCT_LIST_LIMIT_MAX
    ),
  };
}

export function loadEnv(source?: EnvSource): AppConfig {
  if (source) {
    return buildAppConfigFromSource(source);
  }

  const appConfig = buildAppConfigFromSource(process.env);
  process.env.APP_ENV = appConfig.APP_ENV;
  return appConfig;
}

// TODO(future work): Add optional dotenv loading + startup cache for local DX.
// Kept for backward compatibility with existing tests.
export function resetEnvCacheForTest(): void {
  // no-op
}
