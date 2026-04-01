import { loadEnv, resetEnvCacheForTest } from "./loadEnv";

const originalAppEnv = process.env.APP_ENV;
const originalPort = process.env.PORT;
const originalMongoUri = process.env.MONGO_URI;
const originalMongoMaxPoolSize = process.env.MONGO_MAX_POOL_SIZE;
const originalJwtSecret = process.env.JWT_SECRET;
const originalProductListLimitMax = process.env.PRODUCT_LIST_LIMIT_MAX;

beforeEach(() => {
  resetEnvCacheForTest();
  delete process.env.APP_ENV;
  delete process.env.PORT;
  delete process.env.MONGO_URI;
  delete process.env.MONGO_MAX_POOL_SIZE;
  delete process.env.JWT_SECRET;
  delete process.env.PRODUCT_LIST_LIMIT_MAX;
});

afterEach(() => {
  process.env.APP_ENV = originalAppEnv;
  process.env.PORT = originalPort;
  process.env.MONGO_URI = originalMongoUri;
  process.env.MONGO_MAX_POOL_SIZE = originalMongoMaxPoolSize;
  process.env.JWT_SECRET = originalJwtSecret;
  process.env.PRODUCT_LIST_LIMIT_MAX = originalProductListLimitMax;
  resetEnvCacheForTest();
});

/**
 * Verifies that backend startup config is derived from environment variables
 * consistently, including normalization, numeric parsing, and failure modes
 * for missing or invalid required values.
 */
describe("loadEnv", () => {
  it("builds config from an explicit source", buildsConfigFromExplicitSource);
  it("reads process.env and normalizes APP_ENV", readsProcessEnvAndNormalizesAppEnv);
  it("defaults APP_ENV to dev for unsupported values", defaultsAppEnvToDev);
  it("treats blank MONGO_MAX_POOL_SIZE as undefined", treatsBlankMongoMaxPoolSizeAsUndefined);
  it("treats blank JWT_SECRET as undefined", treatsBlankJwtSecretAsUndefined);
  it("throws when a required env value is missing", throwsForMissingRequiredValue);
  it("throws when a positive integer env value is invalid", throwsForInvalidPositiveInt);
  it("throws when an optional positive integer env value is invalid", throwsForInvalidOptionalPositiveInt);
});

/**
 * Confirms the parser can build a complete config object from a provided
 * source without depending on process.env.
 */
function buildsConfigFromExplicitSource(): void {
  const config = loadEnv({
    APP_ENV: "stg",
    PORT: "3001",
    MONGO_URI: "mongodb://localhost:27017/seng4640_test",
    MONGO_MAX_POOL_SIZE: "25",
    JWT_SECRET: " test-secret ",
    PRODUCT_LIST_LIMIT_MAX: "25",
  });

  expect(config).toEqual({
    APP_ENV: "stg",
    PORT: 3001,
    MONGO_URI: "mongodb://localhost:27017/seng4640_test",
    MONGO_MAX_POOL_SIZE: 25,
    JWT_SECRET: "test-secret",
    PRODUCT_LIST_LIMIT_MAX: 25,
  });
}

/**
 * Confirms the default code path reads process.env, normalizes APP_ENV, and
 * writes the normalized value back to process.env.
 */
function readsProcessEnvAndNormalizesAppEnv(): void {
  process.env.APP_ENV = " STG ";
  process.env.PORT = "5000";
  process.env.MONGO_URI = "mongodb://localhost:27017/seng4640_test";
  process.env.MONGO_MAX_POOL_SIZE = "20";
  process.env.JWT_SECRET = "secret";
  process.env.PRODUCT_LIST_LIMIT_MAX = "100";

  const config = loadEnv();

  expect(config.APP_ENV).toBe("stg");
  expect(config.PORT).toBe(5000);
  expect(config.MONGO_MAX_POOL_SIZE).toBe(20);
  expect(process.env.APP_ENV).toBe("stg");
}

/**
 * Ensures unsupported APP_ENV values fall back to the safe default used by
 * the application.
 */
function defaultsAppEnvToDev(): void {
  const config = loadEnv({
    APP_ENV: "production",
    PORT: "3000",
    MONGO_URI: "mongodb://localhost:27017/seng4640_dev",
    PRODUCT_LIST_LIMIT_MAX: "10",
  });

  expect(config.APP_ENV).toBe("dev");
}

/**
 * Ensures blank optional numeric config is normalized away instead of being
 * treated as a real limit.
 */
function treatsBlankMongoMaxPoolSizeAsUndefined(): void {
  const config = loadEnv({
    APP_ENV: "dev",
    PORT: "3000",
    MONGO_URI: "mongodb://localhost:27017/seng4640_dev",
    MONGO_MAX_POOL_SIZE: "   ",
    PRODUCT_LIST_LIMIT_MAX: "10",
  });

  expect(config.MONGO_MAX_POOL_SIZE).toBeUndefined();
}

/**
 * Ensures blank optional secrets are normalized away instead of being treated
 * as meaningful values.
 */
function treatsBlankJwtSecretAsUndefined(): void {
  const config = loadEnv({
    APP_ENV: "dev",
    PORT: "3000",
    MONGO_URI: "mongodb://localhost:27017/seng4640_dev",
    JWT_SECRET: "   ",
    PRODUCT_LIST_LIMIT_MAX: "10",
  });

  expect(config.JWT_SECRET).toBeUndefined();
}

/**
 * Verifies startup fails fast with a clear error when a required env value is
 * absent.
 */
function throwsForMissingRequiredValue(): void {
  expect(() =>
    loadEnv({
      APP_ENV: "dev",
      PORT: "3000",
      PRODUCT_LIST_LIMIT_MAX: "10",
    })
  ).toThrow("[loadEnv] Missing env value: MONGO_URI");
}

/**
 * Verifies numeric env values must be positive integers so invalid runtime
 * configuration is rejected immediately.
 */
function throwsForInvalidPositiveInt(): void {
  expect(() =>
    loadEnv({
      APP_ENV: "dev",
      PORT: "0",
      MONGO_URI: "mongodb://localhost:27017/seng4640_dev",
      PRODUCT_LIST_LIMIT_MAX: "10",
    })
  ).toThrow("[loadEnv] Invalid positive integer env value: PORT");
}

/**
 * Verifies optional numeric env values are still validated when provided.
 */
function throwsForInvalidOptionalPositiveInt(): void {
  expect(() =>
    loadEnv({
      APP_ENV: "dev",
      PORT: "3000",
      MONGO_URI: "mongodb://localhost:27017/seng4640_dev",
      MONGO_MAX_POOL_SIZE: "0",
      PRODUCT_LIST_LIMIT_MAX: "10",
    })
  ).toThrow("[loadEnv] Invalid positive integer env value: MONGO_MAX_POOL_SIZE");
}
