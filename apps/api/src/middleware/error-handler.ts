import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { BookingConflictError, NotFoundError, UnauthorizedError } from "../errors";

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof BookingConflictError) {
    res.status(409).json({
      success: false,
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) }
    });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({
      success: false,
      error: { code: "not_found", message: err.message }
    });
    return;
  }

  if (err instanceof UnauthorizedError) {
    res.status(401).json({
      success: false,
      error: { code: "unauthorized", message: err.message }
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "validation_error",
        message: "Request validation failed.",
        details: err.flatten()
      }
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      success: false,
      error: {
        code: "validation_error",
        message: "Request validation failed.",
        details: Object.fromEntries(Object.entries(err.errors).map(([key, value]) => [key, (value as any).message]))
      }
    });
    return;
  }

  const maybeError = err as { code?: number; message?: string };
  if (maybeError?.code === 11000) {
    res.status(409).json({
      success: false,
      error: {
        code: "duplicate_key",
        message: "A record with the same unique value already exists."
      }
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    success: false,
    error: {
      code: "internal_error",
      message: maybeError?.message ?? "Unexpected server error."
    }
  });
}
