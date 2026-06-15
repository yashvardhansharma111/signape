import mongoose from "mongoose";
import { Device } from "../models/Device.js";
import { Media } from "../models/Media.js";
import { Playlist } from "../models/Playlist.js";
import { Content } from "../models/Content.js";
import { PresentSession } from "../models/PresentSession.js";
import { formatMedia } from "../utils/format.js";
import type { PlaybackStartPayload, StreamMediaItem, StreamContentItem, StreamPlaylistItem } from "../socket/types.js";

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

export async function resolvePlaylistItems(playlistId: string): Promise<StreamPlaylistItem[]> {
  if (!mongoose.isValidObjectId(playlistId)) return [];

  const playlist = await Playlist.findById(playlistId).lean();
  if (!playlist) return [];

  const items: StreamPlaylistItem[] = [];

  // Resolve media items
  if (playlist.mediaIds?.length) {
    const media = await Media.find({ _id: { $in: playlist.mediaIds } }).sort({ uploadedAt: -1 });
    for (const item of media) {
      if (item.type !== "video" && item.type !== "image") continue;
      const formatted = formatMedia(item);
      items.push({
        id: formatted.id,
        name: formatted.name,
        type: formatted.type as "image" | "video",
        url: formatted.url,
      } as StreamMediaItem);
    }
  }

  // Resolve content items (canvas layouts)
  if (playlist.contentIds?.length) {
    const validContentIds = playlist.contentIds.filter((id) => mongoose.isValidObjectId(id));
    const contents = await Content.find({ _id: { $in: validContentIds } }).lean();
    const contentMap = new Map(contents.map((c) => [c._id.toString(), c]));

    for (const cid of validContentIds) {
      const c = contentMap.get(cid);
      if (!c) continue;
      items.push({
        id: c._id.toString(),
        name: c.name,
        type: "content",
        background: c.background,
        canvasWidth: c.canvasWidth,
        canvasHeight: c.canvasHeight,
        elements: c.elements ?? [],
        duration: 10,
      } as StreamContentItem);
    }
  }

  // Fallback: if no items at all, grab recent media
  if (items.length === 0) {
    const fallback = await Media.find({ type: { $in: ["video", "image"] } })
      .sort({ uploadedAt: -1 })
      .limit(20);
    for (const item of fallback) {
      const formatted = formatMedia(item);
      items.push({
        id: formatted.id,
        name: formatted.name,
        type: formatted.type as "image" | "video",
        url: formatted.url,
      } as StreamMediaItem);
    }
  }

  return items;
}

// Keep old name for backward compat with scheduler
export async function resolvePlaylistMedia(playlistId: string): Promise<StreamMediaItem[]> {
  const items = await resolvePlaylistItems(playlistId);
  return items.filter((i): i is StreamMediaItem => i.type !== "content");
}

export async function buildPlaybackPayload(
  playlistId: string,
  startedAt: Date
): Promise<PlaybackStartPayload> {
  const playlist = await Playlist.findById(playlistId).lean();
  const items = await resolvePlaylistItems(playlistId);

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
