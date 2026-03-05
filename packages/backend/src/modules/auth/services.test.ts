import bcrypt from "bcryptjs";
import type { InferSchemaType, Types } from "mongoose";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoServerError } from "mongodb";
import { UserRole } from "@seng4640/shared";
import { userModel, userSchema  } from "../../db/models/user.models";
import {
  ConflictError,
  ServiceUnavailableError,
  UnauthorizedError,
} from "../../utils/errors";
import { login as loginCustomer, registerCustomer } from "./service";

type DbUser = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };
type LoginProjection = Pick<DbUser, "name" | "email" | "role" | "passwordHash"> & {
  _id: Types.ObjectId;
};


jest.mock("../../db/models/user.models", () => ({
  userModel: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
}));

const originalSecret = process.env.JWT_SECRET;

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret";
  jest.clearAllMocks();
});

afterEach(() => {
  process.env.JWT_SECRET = originalSecret;
});

describe("auth service", () => {
  it("registerCustomer signs JWT with env secret", customerRegisterSuccess);
  it(
    "registerCustomer throws ConflictError when email already exists",
    customerRegisterConflictError
  );
  it(
    "registerCustomer throws ServiceUnavailableError when JWT_SECRET is missing",
    customerRegisterServiceUnavailableError
  );
  it(
    "login throws UnauthorizedError when email does not exist",
    customerLoginEmailNotFoundError
  );
  it(
    "login throws UnauthorizedError when password is invalid",
    customerLoginInvalidPasswordError
  );
  it("login returns token and user when credentials are valid", customerLoginSuccess);
});

async function customerRegisterSuccess(): Promise<void> {
  const mockedCreate = userModel.create as unknown as jest.Mock;

  mockedCreate.mockResolvedValue({
    _id: new mongoose.Types.ObjectId("64b64c2ecf77b6a7f39d9f11"),
  });

  const result = await registerCustomer({
    name: "Alice",
    email: "alice@example.com",
    password: "password123",
  });

  const decoded = jwt.verify(result.accessToken, "test-secret");
  if (typeof decoded === "string") {
    throw new Error("Decoded payload is string");
  }

  expect(decoded).toMatchObject({
    id: result.user.id,
    role: UserRole.CUSTOMER,
  });
  expect(result.user.role).toBe(UserRole.CUSTOMER);
}

async function customerRegisterConflictError(): Promise<void> {
  const mockedCreate = userModel.create as unknown as jest.Mock;
  const duplicateKeyError = new MongoServerError({
    errmsg: "E11000 duplicate key error",
    code: 11000,
  });

  mockedCreate.mockRejectedValue(duplicateKeyError);

  await expect(
    registerCustomer({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
    })
  ).rejects.toBeInstanceOf(ConflictError);
}

async function customerRegisterServiceUnavailableError(): Promise<void> {
  const mockedCreate = userModel.create as unknown as jest.Mock;
  mockedCreate.mockResolvedValue({
    _id: new mongoose.Types.ObjectId("64b64c2ecf77b6a7f39d9f11"),
  });
  delete process.env.JWT_SECRET;//no JWT Scret

  await expect(
    registerCustomer({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
    })
  ).rejects.toBeInstanceOf(ServiceUnavailableError);
}

async function customerLoginEmailNotFoundError(): Promise<void> {
  const mockedFindOne = userModel.findOne as unknown as jest.Mock;
  mockedFindOne.mockReturnValue(buildFindOneChain(null));

  await expect(
    loginCustomer({
      email: "missing@example.com",
      password: "password123",
    })
  ).rejects.toMatchObject({
    reason: "email_not_found",
  } satisfies Partial<UnauthorizedError>);
}

async function customerLoginInvalidPasswordError(): Promise<void> {
  const mockedFindOne = userModel.findOne as unknown as jest.Mock;
    
  const mockUser = {
      _id: new mongoose.Types.ObjectId("64b64c2ecf77b6a7f39d9f11"),
      name: "Alice",
      email: "alice@example.com",
      role: UserRole.CUSTOMER,
      passwordHash: await bcrypt.hash("correct-password", 10),
    }satisfies LoginProjection;
    
  mockedFindOne.mockReturnValue(
    buildFindOneChain(mockUser)
  );

  await expect(
    loginCustomer({
      email: "alice@example.com",
      password: "wrong-password",
    })
  ).rejects.toMatchObject({
    reason: "invalid_password",
  } satisfies Partial<UnauthorizedError>);
}

async function customerLoginSuccess(): Promise<void> {
  const mockedFindOne = userModel.findOne as unknown as jest.Mock;
  const userId = new mongoose.Types.ObjectId("64b64c2ecf77b6a7f39d9f11");
  
  const mockUser = {
      _id: userId,
      name: "Manager One",
      email: "manager@example.com",
      role: UserRole.MANAGER,
      passwordHash: await bcrypt.hash("password123", 10),
  } satisfies LoginProjection;
    

  mockedFindOne.mockReturnValue(
    buildFindOneChain(mockUser)
  );

  const result = await loginCustomer({
    email: " manager@example.com ",
    password: "password123",
  });

  expect(mockedFindOne).toHaveBeenCalledWith({ email: "manager@example.com" });
  expect(result.user).toMatchObject({
    id: userId.toString(),
    name: "Manager One",
    email: "manager@example.com",
    role: UserRole.MANAGER,
  });

  const decoded = jwt.verify(result.accessToken, "test-secret");
  if (typeof decoded === "string") {
    throw new Error("Decoded payload is string");
  }
  expect(decoded).toMatchObject({
    id: userId.toString(),
    role: UserRole.MANAGER,
  });
}

function buildFindOneChain(user: LoginProjection | null) {
  return {
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(user),
    }),
  };
}
