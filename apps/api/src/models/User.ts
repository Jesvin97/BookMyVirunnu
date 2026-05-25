import { Schema, model, type Document, type Model } from "mongoose";
import type { UserRole, DomainUser } from "@bookmyvirunnu/shared";

export interface UserDocument extends Document, Omit<DomainUser, "_id"> {
  _id: import("mongoose").Types.ObjectId;
  role: UserRole;
}

const UserSchema = new Schema<UserDocument>(
  {
    role: { type: String, enum: ["couple", "guest", "admin"], required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 140 },
    email: { type: String, required: true, trim: true, lowercase: true, index: true, unique: true },
    phone: { type: String, trim: true, index: true, sparse: true },
    passwordHash: { type: String, required: true, select: false },
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

UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

export const UserModel: Model<UserDocument> = model<UserDocument>("User", UserSchema);
