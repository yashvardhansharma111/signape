import mongoose, { Schema, type Document } from "mongoose";
import { toJsonTransform } from "../utils/toJson.js";

export interface IMedia extends Document {
  name: string;
  type: "image" | "video" | "document";
  sizeKb: number;
  url: string;
  key: string;
  uploadedAt: Date;
}

const mediaSchema = new Schema<IMedia>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["image", "video", "document"], required: true },
    sizeKb: { type: Number, required: true },
    url: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: toJsonTransform,
    },
  }
);

export const Media = mongoose.model<IMedia>("Media", mediaSchema);
