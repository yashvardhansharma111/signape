import mongoose, { Schema, type Document } from "mongoose";
import { toJsonTransform } from "../utils/toJson.js";

export interface ISettings extends Document {
  displayName: string;
  email: string;
  organization: string;
  timezone: string;
  notifications: boolean;
}

const settingsSchema = new Schema<ISettings>(
  {
    displayName: { type: String, default: "Signape User" },
    email: { type: String, default: "user@signape.com" },
    organization: { type: String, default: "Signape" },
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
