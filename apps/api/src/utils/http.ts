import type { NextFunction, Request, Response } from "express";

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
}

export function sendSuccess<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({ success: true, data });
}

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): Response {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  });
}
