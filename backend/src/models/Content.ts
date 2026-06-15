import mongoose, { Schema, type Document } from "mongoose";
import { toJsonTransform } from "../utils/toJson.js";

export interface CanvasElement {
  id: string;
  type: "image" | "video" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  // media elements
  url?: string;
  mediaName?: string;
  // text elements
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: string;
  backgroundColor?: string;
}

export interface IContent extends Document {
  name: string;
  canvasWidth: number;
  canvasHeight: number;
  background: string;
  elements: CanvasElement[];
}

const elementSchema = new Schema<CanvasElement>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["image", "video", "text"], required: true },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 300 },
    height: { type: Number, default: 200 },
    url: String,
    mediaName: String,
    text: String,
    fontSize: { type: Number, default: 24 },
    fontWeight: { type: String, default: "normal" },
    color: { type: String, default: "#000000" },
    textAlign: { type: String, default: "left" },
    backgroundColor: { type: String, default: "transparent" },
  },
  { _id: false }
);

const contentSchema = new Schema<IContent>(
  {
    name: { type: String, required: true, trim: true },
    canvasWidth: { type: Number, default: 1920 },
    canvasHeight: { type: Number, default: 1080 },
    background: { type: String, default: "#000000" },
    elements: { type: [elementSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: toJsonTransform },
  }
);

export const Content = mongoose.model<IContent>("Content", contentSchema);
