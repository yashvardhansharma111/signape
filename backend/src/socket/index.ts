import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { Device } from "../models/Device.js";
import { verifyAccessToken } from "../services/auth.js";
import {
  buildPlaybackPayload,
  getActivePresentForDevice,
  markDeviceOffline,
  markDeviceOnline,
} from "../services/streaming.js";
import { getLiveDeviceStats } from "../services/index.js";
import type { DeviceConnectedPayload, LiveStatsPayload, PlaybackStartPayload } from "./types.js";
import { setIo } from "./registry.js";

let io: Server | null = null;

async function emitLiveStats() {
  if (!io) return;
  const stats: LiveStatsPayload = await getLiveDeviceStats();
  io.to("dashboard").emit("live:stats", stats);
}

export function attachSocketServer(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigin,
      credentials: true,
    },
  });

  io.on("connection", async (socket) => {
    const auth = socket.handshake.auth as {
      role?: string;
      deviceId?: string;
      deviceToken?: string;
      token?: string;
    };

    if (auth.role === "device") {
      const { deviceId, deviceToken } = auth;

      if (!deviceId || !deviceToken || !mongoose.isValidObjectId(deviceId)) {
        socket.disconnect();
        return;
      }

      const device = await Device.findById(deviceId);
      if (!device || device.deviceToken !== deviceToken) {
        socket.disconnect();
        return;
      }

      const room = `device:${deviceId}`;
      socket.join(room);
      socket.data.role = "device";
      socket.data.deviceId = deviceId;

      await markDeviceOnline(deviceId);

      const connectedPayload: DeviceConnectedPayload = {
        deviceId,
        name: device.name,
        status: "online",
      };
      io!.to("dashboard").emit("device:connected", connectedPayload);
      await emitLiveStats();

      const activePresent = await getActivePresentForDevice(deviceId);
      if (activePresent?.playlistId) {
        const payload = await buildPlaybackPayload(
          activePresent.playlistId.toString(),
          activePresent.startedAt ?? new Date()
        );
        socket.emit("playback:start", payload);
      }

      socket.on("heartbeat", async () => {
        await markDeviceOnline(deviceId);
      });

      socket.on("disconnect", async () => {
        const stillConnected = io!.sockets.adapter.rooms.get(room);
        if (!stillConnected || stillConnected.size === 0) {
          await markDeviceOffline(deviceId);
          io!.to("dashboard").emit("device:disconnected", { deviceId, status: "offline" });
          await emitLiveStats();
        }
      });

      return;
    }

    if (auth.role === "dashboard") {
      if (!auth.token) {
        socket.disconnect();
        return;
      }

      try {
        verifyAccessToken(auth.token);
      } catch {
        socket.disconnect();
        return;
      }

      socket.join("dashboard");
      socket.data.role = "dashboard";

      const stats = await getLiveDeviceStats();
      socket.emit("live:stats", stats);
      return;
    }

    socket.disconnect();
  });

  console.log("WebSocket server ready");
  setIo(io);
  return io;
}

export function emitPresentToDevices(deviceIds: string[], payload: PlaybackStartPayload) {
  if (!io) return;

  for (const deviceId of deviceIds) {
    io.to(`device:${deviceId}`).emit("playback:start", payload);
  }

  io.to("dashboard").emit("present:delivered", {
    deviceIds,
    playlistId: payload.playlistId,
    playlistName: payload.playlistName,
    deliveredAt: new Date().toISOString(),
  });
}

export function emitPresentStop(deviceIds: string[]) {
  if (!io) return;

  for (const deviceId of deviceIds) {
    io.to(`device:${deviceId}`).emit("playback:stop", {});
  }
}
