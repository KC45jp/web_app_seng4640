import type { Express } from "express";
import mongoose from "mongoose";
import type { AppEnv } from "@/config/loadEnv";

type LivenessBody = {
  status: "ok";
  timestamp: string;
};

type ReadinessBody = {
  status: "ok" | "degraded";
  timestamp: string;
  db: "up" | "down";
  mongoUriMasked?: string;
};

type HealthRouteResponse<TBody> = {
  statusCode: number;
  body: TBody;
};

const MONGO_CONNECTED_READY_STATE = 1;

type ReadinessResponseOptions = {
  appEnv?: AppEnv;
  mongoUri?: string;
};

export function buildLivenessResponse(
  now: Date = new Date()
): HealthRouteResponse<LivenessBody> {
  return {
    statusCode: 200,
    body: {
      status: "ok",
      timestamp: now.toISOString(),
    },
  };
}

export function buildReadinessResponse(
  mongoReadyState: number = mongoose.connection.readyState,
  now: Date = new Date(),
  options: ReadinessResponseOptions = {}
): HealthRouteResponse<ReadinessBody> {
  const debugFields = buildReadinessDebugFields(options);

  if (mongoReadyState === MONGO_CONNECTED_READY_STATE) {
    return {
      statusCode: 200,
      body: {
        status: "ok",
        timestamp: now.toISOString(),
        db: "up",
        ...debugFields,
      },
    };
  }

  return {
    statusCode: 503,
    body: {
      status: "degraded",
      timestamp: now.toISOString(),
      db: "down",
      ...debugFields,
    },
  };
}

function buildReadinessDebugFields({
  appEnv,
  mongoUri,
}: ReadinessResponseOptions): Pick<ReadinessBody, "mongoUriMasked"> | {} {
  if (appEnv !== "dev" || !mongoUri) {
    return {};
  }

  return {
    mongoUriMasked: maskMongoUriPassword(mongoUri),
  };
}

export function maskMongoUriPassword(mongoUri: string): string {
  return mongoUri.replace(
    /(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/,
    "$1***$3"
  );
}

export function registerHealthRoutes(
  app: Express,
  options: ReadinessResponseOptions = {}
): void {
  app.get("/api/health", (_req, res) => {
    const response = buildLivenessResponse();
    res.status(response.statusCode).json(response.body);
  });

  app.get("/api/ready", (_req, res) => {
    const response = buildReadinessResponse(
      mongoose.connection.readyState,
      new Date(),
      options
    );
    res.status(response.statusCode).json(response.body);
  });
}
