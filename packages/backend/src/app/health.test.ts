import {
  buildLivenessResponse,
  buildReadinessResponse,
  maskMongoUriPassword,
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

    expect(
      buildReadinessResponse(1, now, {
        appEnv: "dev",
        mongoUri:
          "mongodb+srv://tester:secret-pass@cluster.example.mongodb.net/seng4640?retryWrites=true&w=majority",
      })
    ).toEqual({
      statusCode: 200,
      body: {
        status: "ok",
        timestamp: "2026-04-02T21:55:00.000Z",
        db: "up",
        mongoUriMasked:
          "mongodb+srv://tester:***@cluster.example.mongodb.net/seng4640?retryWrites=true&w=majority",
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

  it("does not expose the masked URI outside dev", () => {
    const now = new Date("2026-04-02T21:55:00.000Z");

    expect(
      buildReadinessResponse(1, now, {
        appEnv: "stg",
        mongoUri:
          "mongodb+srv://tester:secret-pass@cluster.example.mongodb.net/seng4640?retryWrites=true&w=majority",
      })
    ).toEqual({
      statusCode: 200,
      body: {
        status: "ok",
        timestamp: "2026-04-02T21:55:00.000Z",
        db: "up",
      },
    });
  });

  it("masks only the password section of a MongoDB URI", () => {
    expect(
      maskMongoUriPassword(
        "mongodb+srv://tester:secret-pass@cluster.example.mongodb.net/seng4640?retryWrites=true&w=majority"
      )
    ).toBe(
      "mongodb+srv://tester:***@cluster.example.mongodb.net/seng4640?retryWrites=true&w=majority"
    );
  });
});
