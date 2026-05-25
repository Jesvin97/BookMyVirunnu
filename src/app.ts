import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { authRouter } from "./routes/auth.routes";
import { eventRouter } from "./routes/event.routes";
import { availabilityRouter } from "./routes/availability.routes";
import { bookingRouter } from "./routes/booking.routes";
import { errorHandler } from "./middleware/error-handler";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin === "*" ? true : env.corsOrigin,
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.json({
      success: true,
      data: {
        status: "ok",
        service: "bookmyvirunnu-api"
      }
    });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/events", eventRouter);
  app.use("/api/availability-rules", availabilityRouter);
  app.use("/api/bookings", bookingRouter);

  app.use(errorHandler);

  return app;
}
