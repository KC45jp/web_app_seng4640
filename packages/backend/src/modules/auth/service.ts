import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { UserRole } from "@seng4640/shared";
import { MongoServerError } from "mongodb";

import type { AuthTokenPayload, UserCollection, UserDoc } from "../../types/auth";
import {
  loginResultSchema,
  registerResultSchema,
  type LoginInput,
  type LoginResult,
  type RegisterInput,
  type RegisterResult,
} from "./schema";
import { UnauthorizedError, ConflictError, ServiceUnavailableError } from "../../utils/errors";

import {logger} from '../../utils/logger';


// PART 1: Database helpers

/**
 * Checks whether a user with the given email already exists.
 */
const getExistingUserByEmail = async (
  userDB: UserCollection,
  email: string
): Promise<boolean> => (await userDB.findOne({ email })) !== null;

/**
 * Inserts a new customer document into the users collection.
 */
const insertNewUser = async (
  userDB: UserCollection,
  name: string,
  email: string,
  passwordHash: string
) => {
  const result = await userDB.insertOne({
    name,
    email,
    passwordHash,
    role: UserRole.CUSTOMER,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result;
};

/**
 * Registers a customer account and returns an auth response payload.
 *
 * Flow:
 * 1) Validate uniqueness and write user to DB
 * 2) Generate JWT access token
 * 3) Build and parse response shape
 */
export async function registerCustomer(
  _input: RegisterInput
): Promise<RegisterResult> {
  const userDB: UserCollection = mongoose.connection.collection("users");

  // PART 1: DB checks and write
  const exists = await getExistingUserByEmail(userDB, _input.email);
  if (exists) throw new ConflictError();

  logger.debug({exists}, "user-e-mail not conflicting, inserting new user")

  const passwordHash = await bcrypt.hash(_input.password, 10);

  let dbResult;
  try {
    dbResult = await insertNewUser(userDB, _input.name, _input.email, passwordHash);
  } catch (err) {
    if (err instanceof MongoServerError && err.code === 11000) {
      logger.warn({err},"MongoDB insert Failed.");
      throw new ConflictError();
    }
    throw err;
  }
  logger.debug('finished new user inserted correctly.')
  const userId = dbResult.insertedId.toString();

  // PART 2: Access token issuance
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new ServiceUnavailableError();
  const token = jwt.sign({ id: userId, role: UserRole.CUSTOMER }, secret, {
    expiresIn: "1h",
  });

  // PART 3: API response construction
  return registerResultSchema.parse({
    user: {
      id: userId,
      name: _input.name,
      email: _input.email,
      role: UserRole.CUSTOMER,
    },
    accessToken: token,
  });
}

/**
 * Logs in a customer account and returns an auth response payload.
 */
export async function login(_input: LoginInput): Promise<void> {
  // TODO: implement login flow with bcrypt + JWT.
}
