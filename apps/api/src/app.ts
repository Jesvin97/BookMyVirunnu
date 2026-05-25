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

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", env.nodeEnv === "production" ? 1 : false);

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin === "*" ? true : env.corsOrigin,
      credentials: true
    })
  );
  app.use(mongoSanitize());
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

  app.use("/api/auth", authRouter);
  app.use("/api/events", eventRouter);
  app.use("/api/availability-rules", availabilityRouter);
  app.use("/api/bookings", bookingRouter);

  app.use(errorHandler);
  return app;
}
