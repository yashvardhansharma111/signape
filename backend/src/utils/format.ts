import type { IDevice } from "../models/Device.js";
import { Playlist } from "../models/Playlist.js";

export function formatLastSeen(isoDate: string | Date): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export async function enrichDevice(device: IDevice) {
  const playlist = device.playlistId
    ? await Playlist.findById(device.playlistId).lean()
    : null;

  return {
    id: device._id.toString(),
    name: device.name,
    status: device.status,
    location: device.location,
    playlistId: device.playlistId?.toString() ?? "",
    deviceToken: device.deviceToken,
    lastSeenAt: device.lastSeenAt.toISOString(),
    playlist: playlist?.name ?? "None",
    lastSeen: formatLastSeen(device.lastSeenAt),
    occupancy: device.occupancy ?? null,
    gender: device.gender ?? null,
  };
}

export function formatMedia(media: {
  _id: { toString(): string };
  name: string;
  type: "image" | "video" | "document";
  sizeKb: number;
  url: string;
  key: string;
  uploadedAt: Date;
}) {
  return {
    id: media._id.toString(),
    name: media.name,
    type: media.type,
    sizeKb: media.sizeKb,
    url: media.url,
    key: media.key,
    uploadedAt: media.uploadedAt.toISOString(),
  };
}
