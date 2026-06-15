import mongoose from "mongoose";
import { Device } from "../models/Device.js";
import { Media } from "../models/Media.js";
import { Playlist } from "../models/Playlist.js";
import { Schedule } from "../models/Schedule.js";
import { Settings } from "../models/Settings.js";
import { PresentSession } from "../models/PresentSession.js";
import { enrichDevice, formatMedia } from "../utils/format.js";
import { generateDeviceToken } from "../utils/deviceToken.js";
import { buildPlaybackPayload } from "./streaming.js";
import { getConnectedDeviceIds } from "../socket/registry.js";
import type {
  CreateDeviceInput,
  CreateMediaInput,
  CreatePlaylistInput,
  CreateScheduleInput,
  LiveDeviceStats,
  OverviewStats,
  StartPresentInput,
  UpdateDeviceInput,
  UpdatePlaylistInput,
  UpdateScheduleInput,
  UpdateSettingsInput,
} from "../types/index.js";

export async function ensureDeviceTokens() {
  const devices = await Device.find({ $or: [{ deviceToken: { $exists: false } }, { deviceToken: "" }] });
  for (const device of devices) {
    device.deviceToken = generateDeviceToken();
    await device.save();
  }
}

export async function getLiveDeviceStats(): Promise<LiveDeviceStats> {
  const connected = getConnectedDeviceIds();
  const total = await Device.countDocuments();
  const live =
    connected.length > 0
      ? connected.length
      : await Device.countDocuments({ status: "online" });
  return { live, total };
}

export async function listDevices(search?: string) {
  const filter = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const devices = await Device.find(filter).sort({ updatedAt: -1 });
  return Promise.all(devices.map(enrichDevice));
}

export async function getDevice(id: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  const device = await Device.findById(id);
  if (!device) return null;
  return enrichDevice(device);
}

export async function createDevice(input: CreateDeviceInput) {
  let playlistId = input.playlistId;

  if (playlistId && !mongoose.isValidObjectId(playlistId)) {
    playlistId = undefined;
  }

  if (!playlistId) {
    const defaultPlaylist = await Playlist.findOne().sort({ createdAt: 1 });
    if (defaultPlaylist) playlistId = defaultPlaylist._id.toString();
  }

  const device = await Device.create({
    name: input.name,
    location: input.location,
    ...(playlistId ? { playlistId } : {}),
    deviceToken: generateDeviceToken(),
    status: "offline",
    lastSeenAt: new Date(),
  });

  return enrichDevice(device);
}

export async function updateDevice(id: string, input: UpdateDeviceInput) {
  if (!mongoose.isValidObjectId(id)) return null;

  const update: UpdateDeviceInput & { lastSeenAt?: Date } = { ...input };
  if (input.status === "online") {
    update.lastSeenAt = new Date();
  }

  const device = await Device.findByIdAndUpdate(id, update, { new: true });
  if (!device) return null;
  return enrichDevice(device);
}

export async function deleteDevice(id: string) {
  if (!mongoose.isValidObjectId(id)) return false;
  const result = await Device.findByIdAndDelete(id);
  return Boolean(result);
}

export async function listMedia() {
  const media = await Media.find().sort({ uploadedAt: -1 });
  return media.map(formatMedia);
}

export async function createMedia(input: CreateMediaInput) {
  const media = await Media.create({
    name: input.name,
    type: input.type,
    sizeKb: input.sizeKb,
    url: input.url,
    key: input.key,
    uploadedAt: new Date(),
  });
  return formatMedia(media);
}

export async function deleteMedia(id: string) {
  if (!mongoose.isValidObjectId(id)) return false;
  const result = await Media.findByIdAndDelete(id);
  return Boolean(result);
}

export async function countMediaAddedThisWeek() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return Media.countDocuments({ uploadedAt: { $gte: weekAgo } });
}

export async function listPlaylists() {
  const playlists = await Playlist.find().sort({ updatedAt: -1 });
  return playlists.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    status: p.status,
    itemCount: p.mediaIds?.length ?? p.itemCount,
    mediaIds: (p.mediaIds ?? []).map((id) => id.toString()),
    updatedAt: p.updatedAt.toISOString(),
  }));
}

export async function getPlaylist(id: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  const playlist = await Playlist.findById(id);
  if (!playlist) return null;
  return {
    id: playlist._id.toString(),
    name: playlist.name,
    status: playlist.status,
    itemCount: playlist.mediaIds?.length ?? 0,
    mediaIds: (playlist.mediaIds ?? []).map((mid) => mid.toString()),
    updatedAt: playlist.updatedAt.toISOString(),
  };
}

export async function createPlaylist(input: CreatePlaylistInput) {
  const mediaIds = (input.mediaIds ?? []).filter((id) => mongoose.isValidObjectId(id));

  const playlist = await Playlist.create({
    name: input.name.trim(),
    status: input.status ?? "draft",
    mediaIds,
    itemCount: mediaIds.length,
  });

  return getPlaylist(playlist._id.toString());
}

export async function updatePlaylist(id: string, input: UpdatePlaylistInput) {
  if (!mongoose.isValidObjectId(id)) return null;

  const update: Record<string, unknown> = {};

  if (input.name !== undefined) update.name = input.name.trim();
  if (input.status !== undefined) update.status = input.status;
  if (input.mediaIds !== undefined) {
    const mediaIds = input.mediaIds.filter((mid) => mongoose.isValidObjectId(mid));
    update.mediaIds = mediaIds.map((mid) => new mongoose.Types.ObjectId(mid));
    update.itemCount = mediaIds.length;
  }

  const playlist = await Playlist.findByIdAndUpdate(id, update, { new: true });
  if (!playlist) return null;
  return getPlaylist(playlist._id.toString());
}

export async function deletePlaylist(id: string) {
  if (!mongoose.isValidObjectId(id)) return false;
  const result = await Playlist.findByIdAndDelete(id);
  return Boolean(result);
}

export async function getPlaylistName(playlistId: string) {
  if (!mongoose.isValidObjectId(playlistId)) return "Unknown";
  const playlist = await Playlist.findById(playlistId).lean();
  return playlist?.name ?? "Unknown";
}

export async function listSchedules() {
  const schedules = await Schedule.find().sort({ startsAt: 1 });
  const playlists = await Playlist.find().lean();
  const devices = await Device.find().lean();
  const playlistMap = new Map(playlists.map((p) => [p._id.toString(), p.name]));
  const deviceMap = new Map(devices.map((d) => [d._id.toString(), d.name]));

  return schedules.map((s) => {
    const json = s.toJSON() as unknown as {
      id: string;
      name: string;
      playlistId: string;
      deviceIds: string[];
      startsAt: string;
      endsAt: string;
    };
    return {
      ...json,
      playlist: playlistMap.get(json.playlistId) ?? "Unknown",
      devices: json.deviceIds.map((id) => ({
        id,
        name: deviceMap.get(id) ?? "Unknown",
      })),
    };
  });
}

export async function createSchedule(input: CreateScheduleInput) {
  if (!mongoose.isValidObjectId(input.playlistId)) {
    throw new Error("Invalid playlist");
  }

  const schedule = await Schedule.create({
    name: input.name.trim(),
    playlistId: input.playlistId,
    deviceIds: input.deviceIds.filter((id) => mongoose.isValidObjectId(id)),
    startsAt: new Date(input.startsAt),
    endsAt: new Date(input.endsAt),
  });

  const list = await listSchedules();
  return list.find((s) => s.id === schedule._id.toString()) ?? null;
}

export async function updateSchedule(id: string, input: UpdateScheduleInput) {
  if (!mongoose.isValidObjectId(id)) return null;

  const update: Record<string, unknown> = {};
  if (input.name !== undefined) update.name = input.name.trim();
  if (input.playlistId !== undefined) update.playlistId = input.playlistId;
  if (input.deviceIds !== undefined) {
    update.deviceIds = input.deviceIds.filter((did) => mongoose.isValidObjectId(did));
  }
  if (input.startsAt !== undefined) update.startsAt = new Date(input.startsAt);
  if (input.endsAt !== undefined) update.endsAt = new Date(input.endsAt);

  const schedule = await Schedule.findByIdAndUpdate(id, update, { new: true });
  if (!schedule) return null;

  const list = await listSchedules();
  return list.find((s) => s.id === schedule._id.toString()) ?? null;
}

export async function deleteSchedule(id: string) {
  if (!mongoose.isValidObjectId(id)) return false;
  const result = await Schedule.findByIdAndDelete(id);
  return Boolean(result);
}

export async function getSettings(userId: string, user?: { email: string; displayName: string; organization: string }) {
  let settings = await Settings.findOne({ userId });
  if (!settings) {
    settings = await Settings.create({
      userId,
      displayName: user?.displayName ?? "",
      email: user?.email ?? "",
      organization: user?.organization ?? "",
    });
  }
  const json = settings.toJSON();
  return {
    displayName: json.displayName as string,
    email: json.email as string,
    organization: json.organization as string,
    timezone: json.timezone as string,
    notifications: json.notifications as boolean,
  };
}

export async function updateSettings(userId: string, input: UpdateSettingsInput) {
  let settings = await Settings.findOne({ userId });
  if (!settings) {
    settings = await Settings.create({ userId, ...input });
  } else {
    Object.assign(settings, input);
    await settings.save();
  }
  return getSettings(userId);
}

async function getPresentSessionDoc() {
  let session = await PresentSession.findOne();
  if (!session) {
    session = await PresentSession.create({
      deviceIds: [],
      startedAt: null,
    });
  }
  return session;
}

export async function getPresentSession() {
  const session = await getPresentSessionDoc();
  const [devices, playlists] = await Promise.all([
    Device.find().sort({ name: 1 }),
    Playlist.find().sort({ name: 1 }),
  ]);

  const json = session.toJSON() as unknown as {
    playlistId?: string;
    deviceIds: string[];
    startedAt: string | null;
  };

  const playlistId = json.playlistId ?? (playlists[0] ? playlists[0]._id.toString() : "");

  return {
    playlistId,
    playlist: json.playlistId ? await getPlaylistName(json.playlistId) : "None",
    deviceIds: json.deviceIds,
    startedAt: json.startedAt,
    devices: devices.map((device) => ({
      id: device._id.toString(),
      name: device.name,
      status: device.status,
      selected: json.deviceIds.includes(device._id.toString()),
    })),
    playlists: playlists.map((p) => ({ id: p._id.toString(), name: p.name })),
  };
}

export async function startPresent(input: StartPresentInput) {
  const session = await getPresentSessionDoc();
  session.playlistId = new mongoose.Types.ObjectId(input.playlistId);
  session.deviceIds = input.deviceIds.map((id) => new mongoose.Types.ObjectId(id));
  session.startedAt = new Date();
  await session.save();

  const payload = await buildPlaybackPayload(
    session.playlistId.toString(),
    session.startedAt ?? new Date()
  );

  const { emitPresentToDevices } = await import("../socket/index.js");
  emitPresentToDevices(
    session.deviceIds.map((id) => id.toString()),
    payload
  );

  return {
    playlistId: session.playlistId.toString(),
    deviceIds: session.deviceIds.map((id) => id.toString()),
    startedAt: session.startedAt?.toISOString() ?? null,
    playlist: await getPlaylistName(session.playlistId.toString()),
    deliveredTo: session.deviceIds.length,
  };
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const [liveStats, mediaAssets, mediaAddedThisWeek, playlists, draftPlaylists, scheduled, nextSchedule] =
    await Promise.all([
      getLiveDeviceStats(),
      Media.countDocuments(),
      Media.countDocuments({ uploadedAt: { $gte: weekAgo } }),
      Playlist.countDocuments(),
      Playlist.countDocuments({ status: "draft" }),
      Schedule.countDocuments(),
      Schedule.findOne({ startsAt: { $gt: now } }).sort({ startsAt: 1 }).lean(),
    ]);

  let nextScheduleIn = "—";
  if (nextSchedule) {
    const diffHours = Math.max(1, Math.round((nextSchedule.startsAt.getTime() - now.getTime()) / (60 * 60 * 1000)));
    nextScheduleIn = `${diffHours}h`;
  }

  return {
    activeScreens: liveStats.live,
    offlineScreens: liveStats.total - liveStats.live,
    mediaAssets,
    mediaAddedThisWeek,
    playlists,
    draftPlaylists,
    scheduled,
    nextScheduleIn,
  };
}

export async function getOverview() {
  const [stats, liveDevices, recentDevices, present] = await Promise.all([
    getOverviewStats(),
    getLiveDeviceStats(),
    Device.find().sort({ updatedAt: -1 }).limit(4),
    getPresentSessionDoc(),
  ]);

  const recentScreens = await Promise.all(recentDevices.map(enrichDevice));

  return {
    stats,
    liveDevices,
    recentScreens,
    quickPresent: {
      playlist: present.playlistId
        ? await getPlaylistName(present.playlistId.toString())
        : "None",
      selectedDevices: present.deviceIds.length,
      totalDevices: liveDevices.total,
    },
  };
}
