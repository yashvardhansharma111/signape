import mongoose, { Schema, type Document } from "mongoose";
import { toJsonTransform } from "../utils/toJson.js";

export interface ISettings extends Document {
  userId: mongoose.Types.ObjectId;
  displayName: string;
  email: string;
  organization: string;
  timezone: string;
  notifications: boolean;
}

const settingsSchema = new Schema<ISettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    displayName: { type: String, default: "" },
    email: { type: String, default: "" },
    organization: { type: String, default: "" },
    timezone: { type: String, default: "America/New_York" },
    notifications: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: toJsonTransform,
    },
  }
);

export const Settings = mongoose.model<ISettings>("Settings", settingsSchema);
