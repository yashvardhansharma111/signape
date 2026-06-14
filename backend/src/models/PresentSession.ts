import mongoose, { Schema, type Document } from "mongoose";
import { toJsonTransform } from "../utils/toJson.js";

export interface IPresentSession extends Document {
  playlistId?: mongoose.Types.ObjectId;
  deviceIds: mongoose.Types.ObjectId[];
  startedAt: Date | null;
}

const presentSessionSchema = new Schema<IPresentSession>(
  {
    playlistId: { type: Schema.Types.ObjectId, ref: "Playlist" },
    deviceIds: [{ type: Schema.Types.ObjectId, ref: "Device" }],
    startedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        toJsonTransform(_doc, ret);
        if (ret.playlistId) ret.playlistId = String(ret.playlistId);
        if (Array.isArray(ret.deviceIds)) {
          ret.deviceIds = ret.deviceIds.map((id) => String(id));
        }
        if (ret.startedAt instanceof Date) {
          ret.startedAt = ret.startedAt.toISOString();
        }
        return ret;
      },
    },
  }
);

export const PresentSession = mongoose.model<IPresentSession>(
  "PresentSession",
  presentSessionSchema
);
