import type { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { loginSchema, registerSchema } from "../validators/auth";
import { asyncHandler, sendSuccess } from "../utils/http";

const authService = new AuthService();

function serializeUser(user: unknown) {
  const typed = user as {
  _id: { toString(): string };
  role: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  locale: string;
  timezone: string;
  avatarUrl?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  };

  return {
    id: typed._id.toString(),
    role: typed.role,
    name: typed.name,
    email: typed.email,
    phone: typed.phone,
    status: typed.status,
    locale: typed.locale,
    timezone: typed.timezone,
    avatarUrl: typed.avatarUrl,
    lastLoginAt: typed.lastLoginAt,
    createdAt: typed.createdAt,
    updatedAt: typed.updatedAt
  };
}

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const input = registerSchema.parse(req.body);
    const { user, token } = await authService.register({
      role: input.role,
      name: input.name,
      email: input.email,
      phone: input.phone,
      password: input.password,
      timezone: input.timezone,
      locale: input.locale
    });
    sendSuccess(res, { user: serializeUser(user), token }, 201);
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const input = loginSchema.parse(req.body);
    const { user, token } = await authService.login({
      email: input.email,
      password: input.password
    });
    sendSuccess(res, { user: serializeUser(user), token });
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({ success: false, error: { code: "unauthorized", message: "Missing authentication." } });
      return;
    }
    const user = await authService.me(req.auth.id);
    sendSuccess(res, { user: serializeUser(user) });
  });

  logout = asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, { loggedOut: true });
  });
}
