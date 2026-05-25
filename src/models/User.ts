import { Schema, model, type Document, type Model } from "mongoose";

export type UserRole = "couple" | "guest" | "admin";

export interface UserDocument extends Document {
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  status: "active" | "blocked" | "pending_verification";
  locale: string;
  timezone: string;
  avatarUrl?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    role: {
      type: String,
      enum: ["couple", "guest", "admin"],
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true, maxlength: 140 },
    email: { type: String, required: true, trim: true, lowercase: true, index: true, unique: true },
    phone: { type: String, trim: true, index: true, sparse: true },
    passwordHash: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "blocked", "pending_verification"],
      default: "active",
      index: true
    },
    locale: { type: String, default: "en" },
    timezone: { type: String, default: "Asia/Kolkata" },
    avatarUrl: { type: String, trim: true },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });

export const UserModel: Model<UserDocument> = model<UserDocument>("User", UserSchema);
