import { getAuthHeaders, type AuthResponse, type AuthUser, type UserRole } from "./auth";

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

export interface DevicePreviewItem {
  type: "image" | "video" | "content";
  url?: string;
  background?: string;
  name: string;
}

export interface DevicePreview {
  deviceId: string;
  items: DevicePreviewItem[];
}

export interface Device {
  id: string;
  name: string;
  status: "online" | "offline";
  location: string;
  floor: string;
  playlistId: string;
  playlist: string;
  deviceToken: string;
  lastSeenAt: string;
  lastSeen: string;
  occupancy: "occupied" | "unoccupied" | null;
  gender: "male" | "female" | null;
}

export interface LiveOccupancyDevice {
  id: string;
  name: string;
  floor: string;
  location: string;
  status: "online" | "offline";
  occupancy: "occupied" | "unoccupied" | null;
  gender: "male" | "female" | null;
  deviceToken: string;
}

export interface OccupancyFloorStat {
  floor: string;
  total: number;
  occupied: number;
  male: number;
  female: number;
}

export interface OccupancySummary {
  total: number;
  occupied: number;
  unoccupied: number;
  male: number;
  female: number;
  online: number;
  untaggedOccupancy: number;
  untaggedGender: number;
  floors: OccupancyFloorStat[];
}

export interface OccupancyHistoryBucket {
  _id: string;
  label: string;
  occupied: number;
  unoccupied: number;
  male: number;
  female: number;
}

export interface OccupancyHistory {
  period: string;
  start: string;
  end: string;
  buckets: OccupancyHistoryBucket[];
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

export interface DeviceTagStats {
  total: number;
  occupied: number;
  unoccupied: number;
  untaggedOccupancy: number;
  male: number;
  female: number;
  untaggedGender: number;
}

export interface OverviewResponse {
  stats: OverviewStats;
  liveDevices: LiveDeviceStats;
  recentScreens: Device[];
  deviceTags: DeviceTagStats;
  quickPresent: {
    playlist: string;
    selectedDevices: number;
    totalDevices: number;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  organization: string;
  phone: string;
  role: UserRole;
  status: "pending" | "active" | "inactive";
  firstTimeLogin: boolean;
  createdAt: string;
}

export interface PendingUser {
  id: string;
  email: string;
  displayName: string;
  phone: string;
  createdAt: string;
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
  contentIds: string[];
  updatedAt: string;
}

export interface DeviceGroup {
  id: string;
  name: string;
  deviceIds: string[];
  devices: { id: string; name: string; status: "online" | "offline"; location: string }[];
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

export interface CanvasElement {
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

export interface ContentItem {
  id: string;
  name: string;
  canvasWidth: number;
  canvasHeight: number;
  background: string;
  elements: CanvasElement[];
  updatedAt: string;
}

// Strip undefined / null / empty values so they don't appear as "undefined" in URLs
function cleanParams(obj: Record<string, string | undefined | null>): string {
  const filtered = Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== "" && v !== "undefined")
  ) as Record<string, string>;
  return new URLSearchParams(filtered).toString();
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  requestAccess: (data: { email: string; displayName?: string; phone?: string }) =>
    request<{ message: string }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMe: () => request<{ user: AuthUser }>("/api/auth/me"),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  forgotPassword: (email: string) =>
    request<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (data: { token: string; newPassword: string }) =>
    request<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  // Admin
  getAdminUsers: () => request<AdminUser[]>("/api/admin/users"),
  getPendingUsers: () => request<PendingUser[]>("/api/admin/users/pending"),
  activateUser: (id: string, data: { role: UserRole; password: string }) =>
    request<AdminUser>(`/api/admin/users/${id}/activate`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  setUserRole: (id: string, role: UserRole) =>
    request<AdminUser>(`/api/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  toggleUserStatus: (id: string, status: "active" | "inactive") =>
    request<AdminUser>(`/api/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  getLiveDevices: () => request<LiveDeviceStats>("/api/devices/live"),
  getDevices: (search?: string) =>
    request<Device[]>(`/api/devices${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getDevicePreviews: () => request<DevicePreview[]>("/api/devices/previews"),
  createDevice: (data: { name: string; location: string; floor?: string; playlistId?: string; occupancy?: "occupied" | "unoccupied"; gender?: "male" | "female" }) =>
    request<Device>("/api/devices", { method: "POST", body: JSON.stringify(data) }),
  updateDevice: (id: string, data: { name?: string; location?: string; floor?: string; occupancy?: "occupied" | "unoccupied" | null; gender?: "male" | "female" | null }) =>
    request<Device>(`/api/devices/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteDevice: (id: string) => request<void>(`/api/devices/${id}`, { method: "DELETE" }),
  getOccupancyLive: (params?: { floor?: string; gender?: string; status?: string }) => {
    const q = cleanParams(params ?? {});
    return request<LiveOccupancyDevice[]>(`/api/occupancy/live${q ? `?${q}` : ""}`);
  },
  getOccupancyFloors: () => request<string[]>("/api/occupancy/floors"),
  getOccupancySummary: (params?: { floor?: string; gender?: string }) => {
    const q = cleanParams(params ?? {});
    return request<OccupancySummary>(`/api/occupancy/summary${q ? `?${q}` : ""}`);
  },
  getOccupancyHistory: (params: { period: string; date?: string; floor?: string; gender?: string; status?: string }) => {
    const q = cleanParams(params);
    return request<OccupancyHistory>(`/api/occupancy/history?${q}`);
  },
  getPlaylists: () => request<Playlist[]>("/api/playlists"),
  createPlaylist: (data: { name: string; status?: "published" | "draft"; mediaIds?: string[]; contentIds?: string[] }) =>
    request<Playlist>("/api/playlists", { method: "POST", body: JSON.stringify(data) }),
  updatePlaylist: (id: string, data: Partial<{ name: string; status: "published" | "draft"; mediaIds: string[]; contentIds: string[] }>) =>
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
  getContents: () => request<ContentItem[]>("/api/contents"),
  getContent: (id: string) => request<ContentItem>(`/api/contents/${id}`),
  createContent: (data: { name: string; canvasWidth: number; canvasHeight: number; background: string }) =>
    request<ContentItem>("/api/contents", { method: "POST", body: JSON.stringify(data) }),
  updateContent: (id: string, data: Partial<ContentItem>) =>
    request<ContentItem>(`/api/contents/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteContent: (id: string) => request<void>(`/api/contents/${id}`, { method: "DELETE" }),
  getDeviceGroups: () => request<DeviceGroup[]>("/api/device-groups"),
  createDeviceGroup: (data: { name: string; deviceIds?: string[] }) =>
    request<DeviceGroup>("/api/device-groups", { method: "POST", body: JSON.stringify(data) }),
  updateDeviceGroup: (id: string, data: { name?: string; deviceIds?: string[] }) =>
    request<DeviceGroup>(`/api/device-groups/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteDeviceGroup: (id: string) => request<void>(`/api/device-groups/${id}`, { method: "DELETE" }),
};
