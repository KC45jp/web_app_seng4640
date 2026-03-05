import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  UserRole,
  type UserRoleValue,
  type LoginInput,
  type LoginResult,
  type RegisterInput,
  type RegisterResult,
} from "@seng4640/shared";
import { MongoServerError } from "mongodb";

import type { AuthTokenPayload } from "../../types/auth";
import {
  loginResultSchema,
  registerResultSchema,
} from "./schema";
import { loadEnv } from "../../config/loadEnv";

import { UnauthorizedError, ConflictError, ServiceUnavailableError } from "../../utils/errors";

import {logger} from '@/utils/logger';

import {userModel, type CreateUserInput} from "@/db/models/user.models"

// PART 1: Database helpers
/**
 * Inserts a new customer document into the users collection.
 * newUserModel can validate if the e-mail is unique.
 */
const insertNewUser = async (input: CreateUserInput) => userModel.create(input);




const generateToken = (
  userId: string,
  role: UserRoleValue,
  secret = loadEnv().JWT_SECRET
): string => {
  if (!secret) throw new ServiceUnavailableError();
  const payload: AuthTokenPayload = { id: userId, role };
  return jwt.sign(payload, secret, {
    expiresIn: "1h",
  });
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
    
    const createUserInput = {
      name: _input.name,
      email: _input.email.trim().toLowerCase(),
      passwordHash,
      role: UserRole.CUSTOMER,
    } satisfies CreateUserInput;

    dbResult = await insertNewUser(createUserInput);

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
  const token = generateToken(userId, UserRole.CUSTOMER);

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
  return userModel
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

  const userRole = user.role.toString() as UserRoleValue;
  const token = generateToken(user._id.toString(), userRole);

  return loginResultSchema.parse({
    user: {
      id: user._id.toString(),
      name: user.name.toString(),
      email: user.email.toString(),
      role: userRole,
    },
    accessToken: token,
  })

}
