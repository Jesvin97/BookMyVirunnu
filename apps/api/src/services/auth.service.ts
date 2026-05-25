import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { env } from "../config/env";
import { BookingConflictError, UnauthorizedError } from "../errors";
import { UserModel, type UserDocument } from "../models/User";
import type { UserRole } from "@bookmyvirunnu/shared";

export interface RegisterInput {
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  password: string;
  timezone: string;
  locale: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokenPayload {
  id: string;
  role: UserRole;
  email: string;
  name: string;
}

export class AuthService {
  async register(input: RegisterInput): Promise<{ user: UserDocument; token: string }> {
    const existing = await UserModel.findOne({ email: input.email.toLowerCase() });
    if (existing) {
      throw new BookingConflictError("duplicate_key", "An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const [user] = await UserModel.create([
      {
        role: input.role,
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone,
        passwordHash,
        timezone: input.timezone,
        locale: input.locale
      }
    ]);

    return { user, token: this.sign(user) };
  }

  async login(input: LoginInput): Promise<{ user: UserDocument; token: string }> {
    const user = await UserModel.findOne({ email: input.email.toLowerCase() }).select("+passwordHash");
    if (!user) throw new UnauthorizedError("Invalid email or password.");

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError("Invalid email or password.");

    user.lastLoginAt = new Date();
    await user.save();
    return { user, token: this.sign(user) };
  }

  async me(userId: string): Promise<UserDocument> {
    const user = await UserModel.findById(new Types.ObjectId(userId));
    if (!user) throw new UnauthorizedError("User not found.");
    return user;
  }

  sign(user: Pick<UserDocument, "_id" | "role" | "email" | "name">): string {
    const payload: AuthTokenPayload = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name
    };

    return jwt.sign(payload, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn,
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
      subject: user._id.toString()
    });
  }
}
