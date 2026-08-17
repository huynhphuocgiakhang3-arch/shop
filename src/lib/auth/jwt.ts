import { SignJWT, jwtVerify } from "jose";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";

function getSecret(name: "ACCESS" | "REFRESH") {
  const key = name === "ACCESS" ? process.env.JWT_ACCESS_SECRET : process.env.JWT_REFRESH_SECRET;
  if (!key) throw new Error(`Missing ${name} JWT secret in environment`);
  return new TextEncoder().encode(key);
}

export interface JwtPayload {
  sub: string; // userId
  role: string;
}

export async function signAccessToken(payload: JwtPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(getSecret("ACCESS"));
}

export async function signRefreshToken(payload: JwtPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_TTL)
    .sign(getSecret("REFRESH"));
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret("ACCESS"));
  return payload as unknown as JwtPayload;
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret("REFRESH"));
  return payload as unknown as JwtPayload;
}
