import { Router } from "express";
import rateLimit from "express-rate-limit";
import { BookingController } from "../controllers/booking.controller";
import { authenticate } from "../middleware/auth";

const controller = new BookingController();
export const bookingRouter = Router();

const bookingCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false
});
const bookingMutationLimiter = bookingCreateLimiter;

bookingRouter.post("/", authenticate, bookingMutationLimiter, controller.create);
bookingRouter.get("/me", authenticate, controller.listMine);
bookingRouter.post("/:bookingId/confirm", authenticate, bookingMutationLimiter, controller.confirm);
bookingRouter.post("/:bookingId/reject", authenticate, bookingMutationLimiter, controller.reject);
bookingRouter.post("/:bookingId/cancel", authenticate, bookingMutationLimiter, controller.cancel);
bookingRouter.get("/:bookingId", authenticate, controller.getOne);
