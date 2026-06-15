import { getAuthHeaders, type AuthResponse, type AuthUser } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export interface LiveDeviceStats {
  live: number;
  total: number;
}

export interface Device {
  id: string;
  name: string;
  status: "online" | "offline";
  location: string;
  playlistId: string;
  playlist: string;
  deviceToken: string;
  lastSeenAt: string;
  lastSeen: string;
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

export interface OverviewResponse {
  stats: OverviewStats;
  liveDevices: LiveDeviceStats;
  recentScreens: Device[];
  quickPresent: {
    playlist: string;
    selectedDevices: number;
    totalDevices: number;
  };
}

export interface Settings {
  displayName: string;
  email: string;
  organization: string;
  timezone: string;
  notifications: boolean;
}

export interface PresentResponse {
  playlistId: string;
  playlist: string;
  deviceIds: string[];
  startedAt: string | null;
  devices: { id: string; name: string; status: "online" | "offline"; selected: boolean }[];
  playlists: { id: string; name: string }[];
}

export interface Playlist {
  id: string;
  name: string;
  status: "published" | "draft";
  itemCount: number;
  mediaIds: string[];
  updatedAt: string;
}

export interface Schedule {
  id: string;
  name: string;
  playlistId: string;
  playlist: string;
  deviceIds: string[];
  devices: { id: string; name: string }[];
  startsAt: string;
  endsAt: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: "image" | "video" | "document";
  sizeKb: number;
  url: string;
  key: string;
  uploadedAt: string;
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  signup: (data: {
    email: string;
    password: string;
    displayName?: string;
    organization?: string;
  }) =>
    request<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMe: () => request<{ user: AuthUser }>("/api/auth/me"),
  getLiveDevices: () => request<LiveDeviceStats>("/api/devices/live"),
  getDevices: (search?: string) =>
    request<Device[]>(`/api/devices${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  createDevice: (data: { name: string; location: string; playlistId?: string }) =>
    request<Device>("/api/devices", { method: "POST", body: JSON.stringify(data) }),
  getPlaylists: () => request<Playlist[]>("/api/playlists"),
  createPlaylist: (data: { name: string; status?: "published" | "draft"; mediaIds?: string[] }) =>
    request<Playlist>("/api/playlists", { method: "POST", body: JSON.stringify(data) }),
  updatePlaylist: (id: string, data: Partial<{ name: string; status: "published" | "draft"; mediaIds: string[] }>) =>
    request<Playlist>(`/api/playlists/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deletePlaylist: (id: string) => request<void>(`/api/playlists/${id}`, { method: "DELETE" }),
  getSchedules: () => request<Schedule[]>("/api/schedules"),
  createSchedule: (data: {
    name: string;
    playlistId: string;
    deviceIds: string[];
    startsAt: string;
    endsAt: string;
  }) => request<Schedule>("/api/schedules", { method: "POST", body: JSON.stringify(data) }),
  deleteSchedule: (id: string) => request<void>(`/api/schedules/${id}`, { method: "DELETE" }),
  getOverview: () => request<OverviewResponse>("/api/overview"),
  getMedia: () => request<MediaAsset[]>("/api/media"),
  deleteMedia: (id: string) => request<void>(`/api/media/${id}`, { method: "DELETE" }),
  getSettings: () => request<Settings>("/api/settings"),
  updateSettings: (data: Partial<Settings>) =>
    request<Settings>("/api/settings", { method: "PATCH", body: JSON.stringify(data) }),
  getPresent: () => request<PresentResponse>("/api/present"),
  startPresent: (playlistId: string, deviceIds: string[]) =>
    request<{ playlistId: string; deviceIds: string[]; startedAt: string | null; playlist: string; deliveredTo?: number }>(
      "/api/present/start", {
      method: "POST",
      body: JSON.stringify({ playlistId, deviceIds }),
    }),
  stopPresent: () =>
    request<{ stopped: boolean; deviceIds: string[] }>("/api/present/stop", { method: "POST" }),
};
