import jwt, { TokenExpiredError } from "jsonwebtoken";
import { UnauthorizedError, ServiceUnavailableError } from "@/utils/errors";
import type { AuthTokenPayload } from "@/types/auth";
import { authTokenPayloadSchema } from "./schemas";
import { loadEnv } from "@/config/loadEnv";

const appConfig = loadEnv();

export const authValidation = (authorization: string | undefined): AuthTokenPayload => {
  if (!authorization) {
    throw new UnauthorizedError("token_missing");
  }
  if (!authorization.startsWith("Bearer ")) {
    throw new UnauthorizedError("token_malformed");
  }

  const token = authorization.slice("Bearer ".length);

  const secret = appConfig.JWT_SECRET;
  if (!secret) {
    throw new ServiceUnavailableError();
  }

  const decoded = verifyJwtToken(token, secret);

  const verified_jwt_info = authTokenPayloadSchema.safeParse(decoded);
  if (!verified_jwt_info.success) {
    throw new UnauthorizedError("token_payload_invalid");
  }

  return {
    id: verified_jwt_info.data.id,
    role: verified_jwt_info.data.role,
  };
};

const verifyJwtToken = (token: string, secret: string): string | jwt.JwtPayload => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new UnauthorizedError("token_expired");
    }
    throw new UnauthorizedError("token_invalid");
  }
};
