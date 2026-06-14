import mongoose, { Schema, type Document } from "mongoose";
import { toJsonTransform } from "../utils/toJson.js";

export interface IPlaylist extends Document {
  name: string;
  status: "published" | "draft";
  itemCount: number;
  mediaIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const playlistSchema = new Schema<IPlaylist>(
  {
    name: { type: String, required: true },
    status: { type: String, enum: ["published", "draft"], default: "published" },
    itemCount: { type: Number, default: 0 },
    mediaIds: [{ type: Schema.Types.ObjectId, ref: "Media" }],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: toJsonTransform,
    },
  }
);

export const Playlist = mongoose.model<IPlaylist>("Playlist", playlistSchema);
