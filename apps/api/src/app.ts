import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { env } from "./config/env";
import { authRouter } from "./routes/auth.routes";
import { eventRouter } from "./routes/event.routes";
import { availabilityRouter } from "./routes/availability.routes";
import { bookingRouter } from "./routes/booking.routes";
import { errorHandler } from "./middleware/error-handler";
import rateLimit from "express-rate-limit";

type SanitizableRequestPart = "body" | "params" | "headers";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", env.nodeEnv === "production" ? 1 : false);

  const getCorsOrigin = (): string | string[] | boolean | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void) => {
    if (env.nodeEnv !== "production" && env.corsOrigin === "*") {
      return [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
      ];
    }

    if (env.corsOrigin === "*") {
      return false;
    }

    const whitelist = env.corsOrigin.split(",").map((o) => o.trim().replace(/\/$/, ""));
    return (origin, callback) => {
      const sanitizedOrigin = origin ? origin.replace(/\/$/, "") : undefined;
      if (!sanitizedOrigin || whitelist.includes(sanitizedOrigin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    };
  };

  app.use(helmet());
  app.use(
    cors({
      origin: getCorsOrigin(),
      credentials: true
    })
  );
  app.use((req, _res, next) => {
    for (const key of ["body", "params", "headers"] as const satisfies SanitizableRequestPart[]) {
      const value = req[key];
      if (value && typeof value === "object") {
        (req as Record<SanitizableRequestPart, unknown>)[key] = mongoSanitize.sanitize(value);
      }
    }
    next();
  });
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false
  });

  app.use("/api", apiLimiter);

  app.get("/health", (_req, res) => {
    res.json({
      success: true,
      data: { status: "ok", service: "bookmyvirunnu-api" }
    });
  });

  app.get("/", (_req, res) => {
    res.status(200).send(
      "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" /><title>BookMyVirunnu API</title></head><body style=\"font-family:system-ui,sans-serif;padding:24px;\"><h1>BookMyVirunnu API</h1><p>The API is running. Health check: <a href=\"/health\">/health</a></p></body></html>"
    );
  });

  app.get("/favicon.ico", (_req, res) => {
    res.status(204).end();
  });

  app.use("/api/auth", authRouter);
  app.use("/api/events", eventRouter);
  app.use("/api/availability-rules", availabilityRouter);
  app.use("/api/bookings", bookingRouter);

  app.use(errorHandler);
  return app;
}

const app = createApp();
export default app;
