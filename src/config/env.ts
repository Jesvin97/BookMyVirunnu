export interface AppEnv {
  nodeEnv: string;
  port: number;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
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
  port: Number(process.env.PORT ?? 3000),
  mongoUri: required("MONGODB_URI", "mongodb://127.0.0.1:27017/bookmyvirunnu"),
  jwtSecret: required("JWT_SECRET", defaultJwtSecret),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173"
};
