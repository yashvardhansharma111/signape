import mongoose, { Schema, type Document } from "mongoose";
import { toJsonTransform } from "../utils/toJson.js";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  displayName: string;
  organization: string;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    displayName: { type: String, default: "Signape User" },
    organization: { type: String, default: "Signape" },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const cleaned = toJsonTransform(_doc, ret);
        delete cleaned.passwordHash;
        return cleaned;
      },
    },
  }
);

export const User = mongoose.model<IUser>("User", userSchema);
