import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "./auth";

const WS_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export interface StreamMediaItem {
  id: string;
  name: string;
  type: "image" | "video" | "document";
  url: string;
}

export interface StreamCanvasElement {
  id: string;
  type: "image" | "video" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  url?: string;
  mediaName?: string;
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: string;
  backgroundColor?: string;
}

export interface StreamContentItem {
  id: string;
  name: string;
  type: "content";
  background: string;
  canvasWidth: number;
  canvasHeight: number;
  elements: StreamCanvasElement[];
  duration: number;
}

export type StreamPlaylistItem = StreamMediaItem | StreamContentItem;

export interface PlaybackStartPayload {
  playlistId: string;
  playlistName: string;
  items: StreamPlaylistItem[];
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
