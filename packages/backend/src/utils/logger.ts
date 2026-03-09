import pino from "pino";

const isPrettyLoggingEnabled = process.env.APP_ENV !== "stg";

const transport = isPrettyLoggingEnabled
  ? pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    })
  : undefined;

export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? "info",
    base: undefined,
    formatters: {
      level: (label) => ({ level: label.toUpperCase() }),
    },
    redact: {
      paths: [
        "password",
        "passwordHash",
        "accessToken",
        "req.headers.authorization",
        "headers.authorization",
        "authorization",
      ],
      censor: "[Redacted]",
    },
  },
  transport
);
