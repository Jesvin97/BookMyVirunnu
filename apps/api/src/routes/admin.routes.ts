import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authenticate, requireRole } from "../middleware/auth";

export const adminRouter = Router();

// Protect all admin routes
adminRouter.use(authenticate);
adminRouter.use(requireRole("admin"));

// Admin Dashboard - Full View
adminRouter.get("/dashboard", AdminController.getAdminDashboard);
