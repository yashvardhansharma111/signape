import mongoose, { Schema, type Document } from "mongoose";
import { toJsonTransform } from "../utils/toJson.js";

export interface IDevice extends Document {
  name: string;
  status: "online" | "offline";
  location: string;
  floor: string;
  playlistId?: mongoose.Types.ObjectId;
  deviceToken: string;
  lastSeenAt: Date;
  occupancy?: "occupied" | "unoccupied";
  gender?: "male" | "female";
}

const deviceSchema = new Schema<IDevice>(
  {
    name: { type: String, required: true },
    status: { type: String, enum: ["online", "offline"], default: "offline" },
    location: { type: String, required: true },
    floor: { type: String, default: "" },
    playlistId: { type: Schema.Types.ObjectId, ref: "Playlist" },
    deviceToken: { type: String, required: true, unique: true },
    lastSeenAt: { type: Date, default: Date.now },
    occupancy: { type: String, enum: ["occupied", "unoccupied", null], default: undefined },
    gender: { type: String, enum: ["male", "female", null], default: undefined },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: toJsonTransform,
    },
  }
);

export const Device = mongoose.model<IDevice>("Device", deviceSchema);
