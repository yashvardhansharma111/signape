import mongoose, { Schema, type Document } from "mongoose";
import { toJsonTransform } from "../utils/toJson.js";

export type UserRole = "superadmin" | "signage" | "occupancy" | "both";
export type UserStatus = "pending" | "active" | "inactive";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  displayName: string;
  organization: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  firstTimeLogin: boolean;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash:     { type: String, select: false },
    displayName:      { type: String, default: "" },
    organization:     { type: String, default: "" },
    phone:            { type: String, default: "" },
    role:             { type: String, enum: ["superadmin", "signage", "occupancy", "both"], default: "signage" },
    status:           { type: String, enum: ["pending", "active", "inactive"], default: "pending" },
    firstTimeLogin:   { type: Boolean, default: false },
    resetToken:       { type: String, select: false },
    resetTokenExpiry: { type: Date,   select: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const cleaned = toJsonTransform(_doc, ret);
        delete cleaned.passwordHash;
        delete cleaned.resetToken;
        delete cleaned.resetTokenExpiry;
        return cleaned;
      },
    },
  }
);

export const User = mongoose.model<IUser>("User", userSchema);
