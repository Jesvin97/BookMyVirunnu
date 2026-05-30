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
authRouter.use("/quick-register", authLimiter);
authRouter.use("/access-id", authLimiter);

authRouter.post("/register", controller.register);
authRouter.post("/quick-register", controller.quickRegister);
authRouter.post("/login", controller.login);
authRouter.post("/access-id", controller.loginWithFeastId);
authRouter.get("/me", authenticate, controller.me);
authRouter.post("/logout", authenticate, controller.logout);
