import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import {
  UserRole,
  type LoginInput,
  type LoginResult,
  type RegisterInput,
  type RegisterResult,
} from "@seng4640/shared";
import { MongoServerError } from "mongodb";

import type { AuthTokenPayload, UserCollection, UserDoc } from "../../types/auth";
import {
  loginResultSchema,
  registerResultSchema,
} from "./schema";
import { UnauthorizedError, ConflictError, ServiceUnavailableError } from "../../utils/errors";

import {logger} from '../../utils/logger';

import {newUserModel} from "../../db/models/user.models"


// PART 1: Database helpers
/**
 * Inserts a new customer document into the users collection.
 * newUserModel can validate if the e-mail is unique.
 */
const insertNewUser = async (
  name: string,
  email: string,
  passwordHash: string
) => {

  const userResult = await newUserModel.create({
    name: name,
    email: email,
    passwordHash,
    role: UserRole.CUSTOMER,
  })

  return userResult;
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
  // PART 1: DB checks and write
  const passwordHash = await bcrypt.hash(_input.password, 10);

  let dbResult;
  try {
    dbResult = await insertNewUser(_input.name, _input.email, passwordHash);
  } catch (err) {
    if (err instanceof MongoServerError && err.code === 11000) {
      logger.warn({err},"MongoDB insert Failed. Email already exists.");
      throw new ConflictError();
    }
    throw err;
  }
  logger.debug('finished new user inserted correctly.')
  const userId = dbResult._id.toString();

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


const findUserByEmailForLogin = async (emailRaw : string) =>{
  const email = emailRaw.trim().toLowerCase();
  return newUserModel
    .findOne({ email })
    .select("_id name email role passwordHash")
    .lean();
};

/**
 * Logs in a customer account and returns an auth response payload.
 */
export async function login(_input: LoginInput): Promise<LoginResult>{

  const user = await findUserByEmailForLogin(_input.email)
  if(!user){
    logger.info({user}, "user with this e-mail not found")
    throw new UnauthorizedError("email_not_found");
  } 


  if (!(await bcrypt.compare(_input.password, user.passwordHash))){
    logger.info({user}, "Invalid password.")
    throw new UnauthorizedError("invalid_password");
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new ServiceUnavailableError();
  const token = jwt.sign({ id: user._id.toString(), role: user.role.toString()}, secret, {
    expiresIn: "1h",
  });

  return loginResultSchema.parse({
    user: {
      id: user._id.toString(),
      name: user.name.toString(),
      email: user.email.toString(),
      role: user.role.toString(),
    },
    accessToken: token,
  })

}
