"use client";

import { useCallback, useEffect, useState } from "react";
import { Monitor, Wifi, WifiOff, Plus, Search, Copy, ExternalLink, X } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { api, type Device } from "@/lib/api";
import { patchDeviceStatus, useDashboardSocket } from "@/lib/useDashboardSocket";

export default function ScreensPage() {
  const [screens, setScreens] = useState<Device[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", location: "" });

  const loadScreens = useCallback(() => {
    setLoading(true);
    api.getDevices(search || undefined)
      .then(setScreens)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    loadScreens();
  }, [loadScreens]);

  useDashboardSocket({
    onDeviceConnected: ({ deviceId }) => {
      setScreens((prev) => patchDeviceStatus(prev, deviceId, "online"));
    },
    onDeviceDisconnected: ({ deviceId }) => {
      setScreens((prev) => patchDeviceStatus(prev, deviceId, "offline"));
    },
  });

  const getDisplayUrl = (screen: Device) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/display/${screen.id}?token=${screen.deviceToken}`;

  const copyDisplayUrl = async (screen: Device) => {
    await navigator.clipboard.writeText(getDisplayUrl(screen));
    setCopiedId(screen.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.location.trim()) return;
    setCreating(true);
    try {
      await api.createDevice({ name: form.name.trim(), location: form.location.trim() });
      setForm({ name: "", location: "" });
      setShowForm(false);
      loadScreens();
    } catch (error) {
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <DashboardHeader
        title="Screens"
        subtitle="Manage displays and monitor connection status."
      />
      <main className="p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search screens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] py-2.5 pl-10 pr-4 text-sm text-[#042B19] focus:outline-none focus:ring-2 focus:ring-[#042B19]"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add screen
          </button>
        </div>

        {showForm && (
          <div
            className="mb-6 rounded-2xl border bg-white p-5 shadow-sm"
            style={{ borderColor: "#E5E7EB" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-[#042B19]">New screen</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Screen name"
                className="rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm text-[#042B19]"
              />
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Location"
                className="rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm text-[#042B19]"
              />
            </div>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="mt-4 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create screen"}
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading screens...</p>
        ) : screens.length === 0 ? (
          <div
            className="rounded-3xl border border-dashed p-10 text-center text-sm text-gray-500"
            style={{ borderColor: "#E5E7EB" }}
          >
            No screens yet. Add a screen, then open its TV link on the display device.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {screens.map((screen) => (
              <div
                key={screen.id}
                className="rounded-2xl border bg-white p-5 shadow-sm"
                style={{ borderColor: "#E5E7EB" }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#E8F5F0]">
                    <Monitor className="h-5 w-5 text-[#042B19]" />
                  </div>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
                    style={{
                      backgroundColor: screen.status === "online" ? "#DCFCE7" : "#F3F4F6",
                      color: screen.status === "online" ? "#16a34a" : "#6B7280",
                    }}
                  >
                    {screen.status === "online" ? (
                      <Wifi className="h-3 w-3" />
                    ) : (
                      <WifiOff className="h-3 w-3" />
                    )}
                    {screen.status}
                  </span>
                </div>
                <h3 className="mb-1 font-semibold text-[#042B19]">{screen.name}</h3>
                <p className="mb-3 text-sm text-gray-500">{screen.location}</p>
                <div className="space-y-1 border-t pt-3 text-sm" style={{ borderColor: "#E5E7EB" }}>
                  <p className="text-gray-600">
                    Playlist: <span className="font-medium text-gray-900">{screen.playlist}</span>
                  </p>
                  <p className="text-gray-500">Last seen: {screen.lastSeen}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyDisplayUrl(screen)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs font-medium text-[#042B19] hover:bg-gray-50"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedId === screen.id ? "Copied!" : "Copy TV link"}
                  </button>
                  <a
                    href={getDisplayUrl(screen)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-[#16a34a] px-3 py-2 text-xs font-medium text-white hover:opacity-90"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open TV view
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
