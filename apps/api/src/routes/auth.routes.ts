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

const authActiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

authRouter.post("/register", authLimiter, controller.register);
authRouter.post("/quick-register", authLimiter, controller.quickRegister);
authRouter.post("/login", authLimiter, controller.login);
authRouter.post("/access-id", authLimiter, controller.loginWithFeastId);
authRouter.get("/me", authActiveLimiter, authenticate, controller.me);
authRouter.post("/logout", authActiveLimiter, authenticate, controller.logout);
