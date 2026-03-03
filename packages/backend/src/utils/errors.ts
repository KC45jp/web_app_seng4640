export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export type UnauthorizedReason =
  | "invalid_credentials"
  | "email_not_found"
  | "invalid_password"
  | "token_invalid"
  | "token_expired"
  | "token_missing"
  | "token_malformed"
  | "token_payload_invalid"
  ;

export class UnauthorizedError extends AppError {
  constructor(
    public readonly reason: UnauthorizedReason = "invalid_credentials",
    message = "Unauthorized",
  ) {
    super(401, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(409, message);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service unavailable") {
    super(503, message);
  }
}
