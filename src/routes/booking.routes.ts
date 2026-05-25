import { Router } from "express";
import { BookingController } from "../controllers/booking.controller";
import { authenticate } from "../middleware/auth";

const controller = new BookingController();

export const bookingRouter = Router();

bookingRouter.post("/", authenticate, controller.create);
bookingRouter.get("/me", authenticate, controller.listMine);
bookingRouter.post("/:bookingId/confirm", authenticate, controller.confirm);
bookingRouter.post("/:bookingId/reject", authenticate, controller.reject);
bookingRouter.post("/:bookingId/cancel", authenticate, controller.cancel);
bookingRouter.get("/:bookingId", authenticate, controller.getOne);
