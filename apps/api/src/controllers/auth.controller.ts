import type { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { loginSchema, registerSchema } from "../validators/auth";
import { asyncHandler, sendSuccess } from "../utils/http";

const authService = new AuthService();

function serializeUser(user: {
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
}) {
  return {
    id: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    locale: user.locale,
    timezone: user.timezone,
    avatarUrl: user.avatarUrl,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const input = registerSchema.parse(req.body);
    const { user, token } = await authService.register(input);
    sendSuccess(res, { user: serializeUser(user), token }, 201);
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const input = loginSchema.parse(req.body);
    const { user, token } = await authService.login(input);
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
