import type { Collection, ObjectId } from "mongodb";
import type { AuthUser, UserRoleValue } from "@seng4640/shared";

export type { AuthUser, UserRoleValue };

export type AuthTokenPayload = AuthUser;

export type UserDoc = {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRoleValue;
  createdAt: Date;
  updatedAt: Date;
};

export type UserCollection = Collection<UserDoc>;
