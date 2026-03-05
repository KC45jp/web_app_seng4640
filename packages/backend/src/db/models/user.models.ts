import mongoose from 'mongoose';
import { UserRole, type PersistedUserRoleValue } from "@seng4640/shared";

const DB_USER_ROLES = [
  UserRole.CUSTOMER,
  UserRole.MANAGER,
  UserRole.ADMIN,
] as const satisfies readonly PersistedUserRoleValue[];


export const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, required: true, enum: DB_USER_ROLES,},
    passwordHash: { type: String, required: true },
  },
  {
    timestamps: true,
  }
)

export const userModel =
    mongoose.models.User ?? mongoose.model("User", userSchema, "users");


const CREATABLE_DB_USER_ROLES = [
  UserRole.CUSTOMER,
  UserRole.MANAGER,
] as const satisfies readonly PersistedUserRoleValue[];

type CreatableDbUserRole = (typeof CREATABLE_DB_USER_ROLES)[number];

export type CreateUserInput = {
  name: string;
  email: string;
  passwordHash: string;
  role: CreatableDbUserRole;
};
