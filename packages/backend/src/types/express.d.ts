import type { AuthUser } from "./auth";
import type { Logger } from "pino";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId?: string;
      log?: Logger;
    }
  }
}

export {};
