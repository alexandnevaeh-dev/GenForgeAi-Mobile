import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.SESSION_SECRET ?? "genforge-dev-secret-change-in-prod";
const REFRESH_SECRET = `${ACCESS_SECRET}-refresh`;

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tier: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: Pick<JwtPayload, "sub">): string {
  // jwtid guarantees a unique token even when two tokens are minted in the
  // same second for the same user (otherwise they collide on the
  // refresh_tokens.token UNIQUE constraint and the insert throws).
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "30d", jwtid: randomUUID() });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): Pick<JwtPayload, "sub"> {
  return jwt.verify(token, REFRESH_SECRET) as Pick<JwtPayload, "sub">;
}
