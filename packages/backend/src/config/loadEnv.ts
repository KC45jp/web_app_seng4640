export type AppEnv = "dev" | "stg";

// Enum-like env key registry. Keep aligned with backend .env files.
export const EnvKeys = {
  APP_ENV: "APP_ENV",
  PORT: "PORT",
  MONGO_URI: "MONGO_URI",
  MONGO_MAX_POOL_SIZE: "MONGO_MAX_POOL_SIZE",
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
  readonly MONGO_MAX_POOL_SIZE: number | undefined;
  readonly JWT_SECRET: string | undefined;
  readonly PRODUCT_LIST_LIMIT_MAX: number;
};

export type EnvSource = Partial<Record<EnvKey, string | undefined>>;

/**
 * Normalizes an env string by trimming whitespace and treating blank values as
 * missing.
 *
 * Returns `undefined` when the input is not a string or when the trimmed value
 * is empty.
 */
function normalizeEnvString(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Resolves the application environment from the provided source.
 *
 * Only `stg` is preserved explicitly. Any other missing or unsupported value
 * falls back to `dev`.
 */
function resolveAppEnv(source: EnvSource): AppEnv {
  const requested = normalizeEnvString(source.APP_ENV)?.toLowerCase();
  return requested === "stg" ? "stg" : "dev";
}

/**
 * Reads a required env string and throws when the value is missing or blank.
 */
function readRequiredString(source: EnvSource, key: EnvKey): string {
  const value = normalizeEnvString(source[key]);
  if (!value) {
    throw new Error(`[loadEnv] Missing env value: ${key}`);
  }
  return value;
}

/**
 * Reads an optional env string.
 *
 * Blank strings such as `""` or `"   "` are normalized to `undefined`.
 */
function readOptionalString(source: EnvSource, key: EnvKey): string | undefined {
  return normalizeEnvString(source[key]);
}

/**
 * Reads a required positive integer env value.
 *
 * Throws when the value is missing, non-numeric, non-integer, or less than 1.
 */
function readRequiredPositiveInt(source: EnvSource, key: EnvKey): number {
  const raw = readRequiredString(source, key);
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`[loadEnv] Invalid positive integer env value: ${key}`);
  }
  return parsed;
}

/**
 * Reads an optional positive integer env value.
 *
 * Returns `undefined` for missing or blank values. Throws when the value is
 * provided but not a positive integer.
 */
function readOptionalPositiveInt(
  source: EnvSource,
  key: EnvKey
): number | undefined {
  const raw = readOptionalString(source, key);
  if (raw === undefined) {
    return undefined;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`[loadEnv] Invalid positive integer env value: ${key}`);
  }

  return parsed;
}

/**
 * Builds the runtime application config from a provided env source after
 * normalizing and validating each field.
 */
function buildAppConfigFromSource(source: EnvSource): AppConfig {
  const appEnv = resolveAppEnv(source);

  return {
    APP_ENV: appEnv,
    PORT: readRequiredPositiveInt(source, EnvKeys.PORT),
    MONGO_URI: readRequiredString(source, EnvKeys.MONGO_URI),
    MONGO_MAX_POOL_SIZE: readOptionalPositiveInt(
      source,
      EnvKeys.MONGO_MAX_POOL_SIZE
    ),
    JWT_SECRET: readOptionalString(source, EnvKeys.JWT_SECRET),
    PRODUCT_LIST_LIMIT_MAX: readRequiredPositiveInt(
      source,
      EnvKeys.PRODUCT_LIST_LIMIT_MAX
    ),
  };
}

/**
 * Loads application config from either an explicit source or `process.env`.
 *
 * When `process.env` is used, the resolved `APP_ENV` is written back in its
 * normalized form so downstream startup code sees a stable value.
 */
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
/**
 * Legacy test hook kept for compatibility with older callers.
 *
 * The loader no longer caches config, so this function is intentionally a
 * no-op.
 */
export function resetEnvCacheForTest(): void {
  // no-op
}
