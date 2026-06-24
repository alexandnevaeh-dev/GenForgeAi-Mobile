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
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "30d" });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): Pick<JwtPayload, "sub"> {
  return jwt.verify(token, REFRESH_SECRET) as Pick<JwtPayload, "sub">;
}
