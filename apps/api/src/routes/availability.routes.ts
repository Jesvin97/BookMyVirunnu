import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AvailabilityRuleController } from "../controllers/availability-rule.controller";
import { authenticate, requireRole } from "../middleware/auth";

const controller = new AvailabilityRuleController();
export const availabilityRouter = Router();

const availabilityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

availabilityRouter.use(availabilityLimiter);

availabilityRouter.patch("/:ruleId", authenticate, requireRole("couple", "admin"), controller.update);
availabilityRouter.delete("/:ruleId", authenticate, requireRole("couple", "admin"), controller.delete);
