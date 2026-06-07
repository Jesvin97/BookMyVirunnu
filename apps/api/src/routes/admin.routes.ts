import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authenticate, requireRole } from "../middleware/auth";

import rateLimit from "express-rate-limit";

export const adminRouter = Router();

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// Protect all admin routes
adminRouter.use(authenticate);
adminRouter.use(requireRole("admin"));
adminRouter.use(adminLimiter);

// Admin Dashboard - Full View
adminRouter.get("/dashboard", AdminController.getAdminDashboard);
