export type DeviceStatus = "online" | "offline";

export interface CreateDeviceInput {
  name: string;
  location: string;
  playlistId?: string;
  occupancy?: "occupied" | "unoccupied";
  gender?: "male" | "female";
}

export interface UpdateDeviceInput {
  name?: string;
  location?: string;
  status?: DeviceStatus;
  playlistId?: string;
  occupancy?: "occupied" | "unoccupied" | null;
  gender?: "male" | "female" | null;
}

export interface CreateMediaInput {
  name: string;
  type: "image" | "video" | "document";
  sizeKb: number;
  url: string;
  key: string;
}

export interface StartPresentInput {
  playlistId: string;
  deviceIds: string[];
}

export interface UpdateSettingsInput {
  displayName?: string;
  email?: string;
  organization?: string;
  timezone?: string;
  notifications?: boolean;
}

export interface CreatePlaylistInput {
  name: string;
  status?: "published" | "draft";
  mediaIds?: string[];
  contentIds?: string[];
}

export interface UpdatePlaylistInput {
  name?: string;
  status?: "published" | "draft";
  mediaIds?: string[];
  contentIds?: string[];
}

export interface CreateDeviceGroupInput {
  name: string;
  deviceIds?: string[];
}

export interface UpdateDeviceGroupInput {
  name?: string;
  deviceIds?: string[];
}

export interface CreateScheduleInput {
  name: string;
  playlistId: string;
  deviceIds: string[];
  startsAt: string;
  endsAt: string;
}

export interface UpdateScheduleInput {
  name?: string;
  playlistId?: string;
  deviceIds?: string[];
  startsAt?: string;
  endsAt?: string;
}

export interface LiveDeviceStats {
  live: number;
  total: number;
}

export interface OverviewStats {
  activeScreens: number;
  offlineScreens: number;
  mediaAssets: number;
  mediaAddedThisWeek: number;
  playlists: number;
  draftPlaylists: number;
  scheduled: number;
  nextScheduleIn: string;
}
