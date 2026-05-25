import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { sendError } from "../utils/http";
import type { UserRole } from "../models/User";

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    sendError(res, 401, "unauthorized", "Missing bearer token.");
    return;
  }

  const token = header.slice("Bearer ".length);
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as AuthenticatedUser;
    req.auth = decoded;
    next();
  } catch {
    sendError(res, 401, "unauthorized", "Invalid or expired token.");
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      sendError(res, 401, "unauthorized", "Missing authentication.");
      return;
    }

    if (!roles.includes(req.auth.role)) {
      sendError(res, 403, "forbidden", "You do not have permission to access this resource.");
      return;
    }

    next();
  };
}
