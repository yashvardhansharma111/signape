import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "./auth";

const WS_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export interface StreamMediaItem {
  id: string;
  name: string;
  type: "image" | "video" | "document";
  url: string;
}

export interface PlaybackStartPayload {
  playlistId: string;
  playlistName: string;
  items: StreamMediaItem[];
  startedAt: string;
}

export function connectDashboardSocket(): Socket {
  return io(WS_BASE, {
    auth: { role: "dashboard", token: getAccessToken() },
    transports: ["websocket", "polling"],
  });
}

export function connectDeviceSocket(deviceId: string, deviceToken: string): Socket {
  return io(WS_BASE, {
    auth: { role: "device", deviceId, deviceToken },
    transports: ["websocket", "polling"],
  });
}
