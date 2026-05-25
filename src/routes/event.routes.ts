import { Router } from "express";
import { EventController } from "../controllers/event.controller";
import { BookingController } from "../controllers/booking.controller";
import { AvailabilityRuleController } from "../controllers/availability-rule.controller";
import { authenticate, requireRole } from "../middleware/auth";

const controller = new EventController();
const bookingController = new BookingController();
const availabilityController = new AvailabilityRuleController();

export const eventRouter = Router();

eventRouter.get("/public", controller.listPublic);
eventRouter.get("/me", authenticate, controller.listMine);
eventRouter.post("/", authenticate, requireRole("couple", "admin"), controller.create);
eventRouter.patch("/:eventId", authenticate, requireRole("couple", "admin"), controller.update);
eventRouter.post("/:eventId/publish", authenticate, requireRole("couple", "admin"), controller.publish);
eventRouter.post("/:eventId/pause", authenticate, requireRole("couple", "admin"), controller.pause);
eventRouter.post("/:eventId/cancel", authenticate, requireRole("couple", "admin"), controller.cancel);
eventRouter.get("/:eventId/availability", bookingController.previewForEvent);
eventRouter.get("/:eventId/bookings", authenticate, requireRole("couple", "admin"), bookingController.listEventBookings);
eventRouter.get("/:eventId/availability-rules", authenticate, requireRole("couple", "admin"), availabilityController.list);
eventRouter.post("/:eventId/availability-rules", authenticate, requireRole("couple", "admin"), availabilityController.create);
eventRouter.get("/:eventId", controller.getById);
