import type { LoginInput, RegisterInput } from "./schema";

export async function registerCustomer(_input: RegisterInput): Promise<void> {
  // TODO: implement register flow with bcrypt + JWT.
}

export async function login(_input: LoginInput): Promise<void> {
  // TODO: implement login flow with bcrypt + JWT.
}
