import { MongoServerError } from "mongodb";
import { isValidObjectId, type InferSchemaType, type Require_id } from "mongoose";
import type { Logger } from "pino";
import type { GetMeResult, UpdateMeResult } from "@seng4640/shared";

import { userModel, userSchema } from "@/db/models/user.models";
import { BadRequestError, ConflictError, NotFoundError } from "@/utils/errors";

import type { UpdateMeInput } from "./schema";

type UserDoc = Require_id<InferSchemaType<typeof userSchema>>;

function serializeUser(doc: UserDoc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
  };
}

async function findUserById(userId: string): Promise<UserDoc | null> {
  return userModel
    .findById(userId)
    .select("_id name email role")
    .lean<UserDoc | null>();
}

export async function getMe(
  _userId: string,
  requestLogger: Logger
): Promise<GetMeResult> {
  requestLogger.debug({ userId: _userId }, "Get me service started");
  if (!isValidObjectId(_userId)) {
    requestLogger.warn({ userId: _userId }, "Invalid user id");
    throw new BadRequestError("Invalid user id");
  }

  const user = await findUserById(_userId);
  if (!user) {
    requestLogger.info({ userId: _userId }, "User not found");
    throw new NotFoundError("User not found");
  }

  requestLogger.debug({ userId: _userId }, "Get me service completed");
  return {
    user: serializeUser(user),
  };
}

export async function updateMe(
  _userId: string,
  _input: UpdateMeInput,
  requestLogger: Logger
): Promise<UpdateMeResult> {
  requestLogger.debug(
    { userId: _userId, input: _input },
    "Update me service started"
  );
  if (!isValidObjectId(_userId)) {
    requestLogger.warn({ userId: _userId }, "Invalid user id");
    throw new BadRequestError("Invalid user id");
  }

  const update: Record<string, unknown> = {};

  if (_input.name !== undefined) {
    update.name = _input.name.trim();
  }

  if (_input.email !== undefined) {
    update.email = _input.email.trim().toLowerCase();
  }

  try {
    const user =
      Object.keys(update).length === 0
        ? await findUserById(_userId)
        : await userModel
            .findByIdAndUpdate(
              _userId,
              { $set: update },
              {
                new: true,
                runValidators: true,
              }
            )
            .select("_id name email role")
            .lean<UserDoc | null>();

    if (!user) {
      requestLogger.info({ userId: _userId }, "User not found during update");
      throw new NotFoundError("User not found");
    }

    requestLogger.debug(
      { userId: _userId, updatedFields: Object.keys(update) },
      "Update me service completed"
    );

    return {
      user: serializeUser(user),
    };
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      requestLogger.warn(
        { userId: _userId, email: update.email },
        "Update me failed because email already exists"
      );
      throw new ConflictError("Email already exists");
    }

    throw error;
  }
}
