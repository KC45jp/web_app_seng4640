import jwt from "jsonwebtoken";
import * as authorizationModule from "./auth/authorization";
import { requireAuth } from "./auth";

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const originalSecret = process.env.JWT_SECRET;

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret";
  jest.restoreAllMocks();
});

afterEach(() => {
  process.env.JWT_SECRET = originalSecret;
});

it("sets req.user and calls next on valid token", setsReqUserAndCallsNextOnValidToken);
it("returns 401 when authorization header is missing", returns401WhenAuthorizationHeaderIsMissing);
it("returns 503 when JWT secret is missing", returns503WhenJwtSecretMissing);
it("returns 401 when token is invalid", returns401WhenTokenIsInvalid);
it("returns 500 when an unexpected error is thrown", returns500WhenUnexpectedErrorIsThrown);

function setsReqUserAndCallsNextOnValidToken(): void {
  const token = jwt.sign({ id: "u1", role: "customer" }, "test-secret");
  const { req, res, next } = runRequireAuth(`Bearer ${token}`);

  expect(next).toHaveBeenCalled();
  expect(req.user).toEqual({ id: "u1", role: "customer" });
  expect(res.status).not.toHaveBeenCalled();
  expect(res.json).not.toHaveBeenCalled();
}

function returns401WhenAuthorizationHeaderIsMissing(): void {
  const { req, res, next } = runRequireAuth(undefined);

  expect(next).not.toHaveBeenCalled();
  expect(req.user).toBeUndefined();
  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
}

function returns503WhenJwtSecretMissing(): void {
  delete process.env.JWT_SECRET;
  const { req, res, next } = runRequireAuth("Bearer token");

  expect(next).not.toHaveBeenCalled();
  expect(req.user).toBeUndefined();
  expect(res.status).toHaveBeenCalledWith(503);
  expect(res.json).toHaveBeenCalledWith({ message: "Service unavailable" });
}

function returns401WhenTokenIsInvalid(): void {
  const token = jwt.sign({ id: "u1", role: "customer" }, "wrong-secret");
  const { req, res, next } = runRequireAuth(`Bearer ${token}`);

  expect(next).not.toHaveBeenCalled();
  expect(req.user).toBeUndefined();
  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
}

function returns500WhenUnexpectedErrorIsThrown(): void {
  jest
    .spyOn(authorizationModule, "authValidation")
    .mockImplementation(() => {
      throw new Error("unexpected");
    });

  const { req, res, next } = runRequireAuth("Bearer token");

  expect(next).not.toHaveBeenCalled();
  expect(req.user).toBeUndefined();
  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
}

function runRequireAuth(authorizationHeader: string | undefined): {
  req: any;
  res: any;
  next: jest.Mock;
} {
  const req: any = { header: jest.fn().mockReturnValue(authorizationHeader) };
  const res = makeRes();
  const next = jest.fn();

  requireAuth(req, res, next);
  return { req, res, next };
}
