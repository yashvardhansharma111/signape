import mongoose from "mongoose";
import { Device } from "../models/Device.js";
import { Media } from "../models/Media.js";
import { Playlist } from "../models/Playlist.js";
import { PresentSession } from "../models/PresentSession.js";
import { formatMedia } from "../utils/format.js";
import type { PlaybackStartPayload, StreamMediaItem } from "../socket/types.js";

export async function markDeviceOnline(deviceId: string) {
  if (!mongoose.isValidObjectId(deviceId)) return;
  await Device.findByIdAndUpdate(deviceId, {
    status: "online",
    lastSeenAt: new Date(),
  });
}

export async function markDeviceOffline(deviceId: string) {
  if (!mongoose.isValidObjectId(deviceId)) return;
  await Device.findByIdAndUpdate(deviceId, { status: "offline" });
}

export async function getActivePresentForDevice(deviceId: string) {
  if (!mongoose.isValidObjectId(deviceId)) return null;

  const session = await PresentSession.findOne({
    deviceIds: new mongoose.Types.ObjectId(deviceId),
    startedAt: { $ne: null },
  }).sort({ startedAt: -1 });

  return session;
}

export async function resolvePlaylistMedia(playlistId: string): Promise<StreamMediaItem[]> {
  if (!mongoose.isValidObjectId(playlistId)) return [];

  const playlist = await Playlist.findById(playlistId).lean();
  if (playlist?.mediaIds?.length) {
    const media = await Media.find({ _id: { $in: playlist.mediaIds } }).sort({ uploadedAt: -1 });
    return media
      .filter((item) => item.type === "video" || item.type === "image")
      .map((item) => {
        const formatted = formatMedia(item);
        return {
          id: formatted.id,
          name: formatted.name,
          type: formatted.type,
          url: formatted.url,
        };
      });
  }

  const fallbackMedia = await Media.find({ type: { $in: ["video", "image"] } })
    .sort({ uploadedAt: -1 })
    .limit(20);

  return fallbackMedia.map((item) => {
    const formatted = formatMedia(item);
    return {
      id: formatted.id,
      name: formatted.name,
      type: formatted.type,
      url: formatted.url,
    };
  });
}

export async function buildPlaybackPayload(
  playlistId: string,
  startedAt: Date
): Promise<PlaybackStartPayload> {
  const playlist = await Playlist.findById(playlistId).lean();
  const [items] = await Promise.all([resolvePlaylistMedia(playlistId)]);

  return {
    playlistId,
    playlistName: playlist?.name ?? "Unknown",
    items,
    startedAt: startedAt.toISOString(),
  };
}

export async function validateDeviceAccess(deviceId: string, deviceToken: string) {
  if (!mongoose.isValidObjectId(deviceId)) return null;

  const device = await Device.findById(deviceId);
  if (!device || device.deviceToken !== deviceToken) return null;

  return device;
}

export async function getDeviceDisplayState(deviceId: string, deviceToken: string) {
  const device = await validateDeviceAccess(deviceId, deviceToken);
  if (!device) return null;

  const activePresent = await getActivePresentForDevice(deviceId);
  let playback: PlaybackStartPayload | null = null;

  if (activePresent?.playlistId) {
    playback = await buildPlaybackPayload(
      activePresent.playlistId.toString(),
      activePresent.startedAt ?? new Date()
    );
  }

  return {
    device: {
      id: device._id.toString(),
      name: device.name,
      location: device.location,
      status: device.status,
    },
    playback,
  };
}
