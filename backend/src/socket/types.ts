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

export interface LiveStatsPayload {
  live: number;
  total: number;
}

export interface DeviceConnectedPayload {
  deviceId: string;
  name: string;
  status: "online" | "offline";
}
