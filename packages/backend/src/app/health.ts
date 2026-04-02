import type { Express } from "express";
import mongoose from "mongoose";

type LivenessBody = {
  status: "ok";
  timestamp: string;
};

type ReadinessBody = {
  status: "ok" | "degraded";
  timestamp: string;
  db: "up" | "down";
};

type HealthRouteResponse<TBody> = {
  statusCode: number;
  body: TBody;
};

const MONGO_CONNECTED_READY_STATE = 1;

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
  now: Date = new Date()
): HealthRouteResponse<ReadinessBody> {
  if (mongoReadyState === MONGO_CONNECTED_READY_STATE) {
    return {
      statusCode: 200,
      body: {
        status: "ok",
        timestamp: now.toISOString(),
        db: "up",
      },
    };
  }

  return {
    statusCode: 503,
    body: {
      status: "degraded",
      timestamp: now.toISOString(),
      db: "down",
    },
  };
}

export function registerHealthRoutes(app: Express): void {
  app.get("/api/health", (_req, res) => {
    const response = buildLivenessResponse();
    res.status(response.statusCode).json(response.body);
  });

  app.get("/api/ready", (_req, res) => {
    const response = buildReadinessResponse();
    res.status(response.statusCode).json(response.body);
  });
}
