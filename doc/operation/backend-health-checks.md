# Backend Health Checks

The backend exposes two lightweight operational endpoints.

## Endpoints

- `GET /api/health`
  - Liveness check
  - Returns `200` with `{ status: "ok", timestamp }`
- `GET /api/ready`
  - Readiness check
  - Returns `200` when MongoDB is connected
  - Returns `503` with `db: "down"` when MongoDB is not ready

## Dev-Only Debug Detail

In `dev`, the readiness response can include a masked MongoDB URI field for
debugging. The password portion is redacted before it is returned.

## Suggested Usage

- Use `/api/health` for a cheap "process is alive" probe
- Use `/api/ready` for deployment readiness and DB dependency checks

## Related Files

- `packages/backend/src/app/health.ts`
- `packages/backend/src/app/health.test.ts`
