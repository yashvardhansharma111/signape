import mongoose, { Schema, type Document } from "mongoose";
import { toJsonTransform } from "../utils/toJson.js";

export interface ISchedule extends Document {
  name: string;
  playlistId: mongoose.Types.ObjectId;
  deviceIds: mongoose.Types.ObjectId[];
  startsAt: Date;
  endsAt: Date;
}

const scheduleSchema = new Schema<ISchedule>(
  {
    name: { type: String, required: true },
    playlistId: { type: Schema.Types.ObjectId, ref: "Playlist", required: true },
    deviceIds: [{ type: Schema.Types.ObjectId, ref: "Device" }],
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
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
        return ret;
      },
    },
  }
);

export const Schedule = mongoose.model<ISchedule>("Schedule", scheduleSchema);
