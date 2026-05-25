import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";

const controller = new AuthController();
export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

authRouter.use("/register", authLimiter);
authRouter.use("/login", authLimiter);

authRouter.post("/register", controller.register);
authRouter.post("/login", controller.login);
authRouter.get("/me", authenticate, controller.me);
authRouter.post("/logout", authenticate, controller.logout);
