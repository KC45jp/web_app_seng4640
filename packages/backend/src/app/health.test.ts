import {
  buildLivenessResponse,
  buildReadinessResponse,
} from "./health";

describe("health routes", () => {
  it("returns a lightweight liveness response", () => {
    const now = new Date("2026-04-02T21:55:00.000Z");

    expect(buildLivenessResponse(now)).toEqual({
      statusCode: 200,
      body: {
        status: "ok",
        timestamp: "2026-04-02T21:55:00.000Z",
      },
    });
  });

  it("returns ready when MongoDB is connected", () => {
    const now = new Date("2026-04-02T21:55:00.000Z");

    expect(buildReadinessResponse(1, now)).toEqual({
      statusCode: 200,
      body: {
        status: "ok",
        timestamp: "2026-04-02T21:55:00.000Z",
        db: "up",
      },
    });
  });

  it("returns service unavailable when MongoDB is not connected", () => {
    const now = new Date("2026-04-02T21:55:00.000Z");

    expect(buildReadinessResponse(0, now)).toEqual({
      statusCode: 503,
      body: {
        status: "degraded",
        timestamp: "2026-04-02T21:55:00.000Z",
        db: "down",
      },
    });
  });
});
