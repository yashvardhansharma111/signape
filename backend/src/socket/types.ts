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

export interface LiveStatsPayload {
  live: number;
  total: number;
}

export interface DeviceConnectedPayload {
  deviceId: string;
  name: string;
  status: "online" | "offline";
}
