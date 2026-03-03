import jwt from "jsonwebtoken";
import { UserRole } from "@seng4640/shared";
import {
  ServiceUnavailableError,
  UnauthorizedError,
  type UnauthorizedReason,
} from "@/utils/errors";
import { authValidation } from "./authorization";

const originalSecret = process.env.JWT_SECRET;

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret";
});

afterEach(() => {
  process.env.JWT_SECRET = originalSecret;
});

describe("authValidation", () => {
  it("returns id and role for a valid bearer token", returnsUserForValidBearerToken);
  it("throws token_missing when authorization header is missing", throwsTokenMissingForMissingAuthorization);
  it("throws token_malformed when authorization header is not bearer", throwsTokenMalformedForNonBearerAuthorization);
  it("throws ServiceUnavailableError when JWT_SECRET is missing", throwsServiceUnavailableWhenJwtSecretMissing);
  it("throws token_invalid when JWT signature is invalid", throwsTokenInvalidForInvalidSignature);
  it("throws token_expired for expired token", throwsTokenExpiredForExpiredToken);
  it(
    "throws token_payload_invalid when payload does not match schema",
    throwsTokenPayloadInvalidForSchemaMismatch
  );
});

function returnsUserForValidBearerToken(): void {
  const token = jwt.sign({ id: "u1", role: UserRole.CUSTOMER }, "test-secret");

  const result = authValidation(`Bearer ${token}`);

  expect(result).toEqual({ id: "u1", role: UserRole.CUSTOMER });
}

function throwsTokenMissingForMissingAuthorization(): void {
  expectUnauthorizedReason(() => authValidation(undefined), "token_missing");
}

function throwsTokenMalformedForNonBearerAuthorization(): void {
  expectUnauthorizedReason(() => authValidation("Basic abc"), "token_malformed");
}

function throwsServiceUnavailableWhenJwtSecretMissing(): void {
  delete process.env.JWT_SECRET;

  expect(() => authValidation("Bearer any-token")).toThrow(ServiceUnavailableError);
}

function throwsTokenInvalidForInvalidSignature(): void {
  const token = jwt.sign({ id: "u1", role: UserRole.CUSTOMER }, "wrong-secret");

  expectUnauthorizedReason(() => authValidation(`Bearer ${token}`), "token_invalid");
}

function throwsTokenExpiredForExpiredToken(): void {
  const token = jwt.sign(
    { id: "u1", role: UserRole.CUSTOMER },
    "test-secret",
    { expiresIn: "-1s" }
  );

  expectUnauthorizedReason(() => authValidation(`Bearer ${token}`), "token_expired");
}

function throwsTokenPayloadInvalidForSchemaMismatch(): void {
  const token = jwt.sign({ id: "u1", role: UserRole.GUEST }, "test-secret");

  expectUnauthorizedReason(
    () => authValidation(`Bearer ${token}`),
    "token_payload_invalid"
  );
}

function expectUnauthorizedReason(
  run: () => unknown,
  expectedReason: UnauthorizedReason
): void {
  try {
    run();
    throw new Error("Expected UnauthorizedError to be thrown");
  } catch (error) {
    expect(error).toBeInstanceOf(UnauthorizedError);
    if (error instanceof UnauthorizedError) {
      expect(error.reason).toBe(expectedReason);
    }
  }
}
