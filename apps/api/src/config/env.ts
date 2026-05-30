import { existsSync } from "fs";

try {
  if (existsSync(".env")) {
    process.loadEnvFile(".env");
  } else if (existsSync("apps/api/.env")) {
    process.loadEnvFile("apps/api/.env");
  }
} catch (e) {
  // safe fallback
}

export interface AppEnv {
  nodeEnv: string;
  port: number;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtIssuer: string;
  jwtAudience: string;
  corsOrigin: string;
}

const defaultJwtSecret = "bookmyvirunnu-development-jwt-secret";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env: AppEnv = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required("MONGODB_URI", "mongodb://127.0.0.1:27017/bookmyvirunnu"),
  jwtSecret: required("JWT_SECRET", defaultJwtSecret),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  jwtIssuer: process.env.JWT_ISSUER ?? "bookmyvirunnu-api",
  jwtAudience: process.env.JWT_AUDIENCE ?? "bookmyvirunnu-web",
  corsOrigin: process.env.CORS_ORIGIN ?? "*"
};

if (env.nodeEnv === "production" && env.corsOrigin === "*") {
  throw new Error("CORS_ORIGIN must be explicitly set in production.");
}

if (env.jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long.");
}
