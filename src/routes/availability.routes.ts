import { Router } from "express";
import { AvailabilityRuleController } from "../controllers/availability-rule.controller";
import { authenticate, requireRole } from "../middleware/auth";

const controller = new AvailabilityRuleController();

export const availabilityRouter = Router();

availabilityRouter.patch("/:ruleId", authenticate, requireRole("couple", "admin"), controller.update);
availabilityRouter.delete("/:ruleId", authenticate, requireRole("couple", "admin"), controller.delete);
