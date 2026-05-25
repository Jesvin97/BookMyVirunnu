import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";

const controller = new AuthController();

export const authRouter = Router();

authRouter.post("/register", controller.register);
authRouter.post("/login", controller.login);
authRouter.get("/me", authenticate, controller.me);
authRouter.post("/logout", authenticate, controller.logout);
