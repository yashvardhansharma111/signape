import mongoose, { Schema, type Document } from "mongoose";

export interface IOccupancyLog extends Document {
  deviceId: mongoose.Types.ObjectId;
  deviceName: string;
  floor: string;
  location: string;
  gender: "male" | "female" | null;
  status: "occupied" | "unoccupied";
  timestamp: Date;
}

const occupancyLogSchema = new Schema<IOccupancyLog>({
  deviceId:   { type: Schema.Types.ObjectId, ref: "Device", required: true },
  deviceName: { type: String, required: true },
  floor:      { type: String, default: "" },
  location:   { type: String, default: "" },
  gender:     { type: String, enum: ["male", "female", null], default: null },
  status:     { type: String, enum: ["occupied", "unoccupied"], required: true },
  timestamp:  { type: Date, default: Date.now, index: true },
});

// compound index for fast filtering
occupancyLogSchema.index({ floor: 1, timestamp: -1 });
occupancyLogSchema.index({ gender: 1, timestamp: -1 });
occupancyLogSchema.index({ status: 1, timestamp: -1 });

export const OccupancyLog = mongoose.model<IOccupancyLog>("OccupancyLog", occupancyLogSchema);
