import mongoose, { Schema, type Document } from "mongoose";
import { toJsonTransform } from "../utils/toJson.js";

export interface IDeviceGroup extends Document {
  name: string;
  deviceIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const deviceGroupSchema = new Schema<IDeviceGroup>(
  {
    name: { type: String, required: true },
    deviceIds: [{ type: Schema.Types.ObjectId, ref: "Device" }],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: toJsonTransform,
    },
  }
);

export const DeviceGroup = mongoose.model<IDeviceGroup>("DeviceGroup", deviceGroupSchema);
