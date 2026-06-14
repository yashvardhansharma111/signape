"use client";

import { useCallback, useEffect, useState } from "react";
import { Monitor, Play, Presentation, Wifi, WifiOff } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { api, type PresentResponse } from "@/lib/api";
import { patchDeviceStatus, useDashboardSocket } from "@/lib/useDashboardSocket";

export default function PresentPage() {
  const [data, setData] = useState<PresentResponse | null>(null);
  const [playlistId, setPlaylistId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const loadPresent = useCallback(() => {
    api.getPresent()
      .then((response) => {
        setData(response);
        setPlaylistId(response.playlistId);
        setSelectedIds(response.deviceIds);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPresent();
  }, [loadPresent]);

  useDashboardSocket({
    onDeviceConnected: ({ deviceId }) => {
      setData((prev) =>
        prev
          ? {
              ...prev,
              devices: patchDeviceStatus(prev.devices, deviceId, "online"),
            }
          : prev
      );
    },
    onDeviceDisconnected: ({ deviceId }) => {
      setData((prev) =>
        prev
          ? {
              ...prev,
              devices: patchDeviceStatus(prev.devices, deviceId, "offline"),
            }
          : prev
      );
    },
    onPresentDelivered: ({ playlistName, deviceIds }) => {
      setMessage(`Live stream sent: "${playlistName}" to ${deviceIds.length} screen(s).`);
    },
  });

  const toggleDevice = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((deviceId) => deviceId !== id) : [...prev, id]
    );
  };

  const handleStart = async () => {
    if (!playlistId || selectedIds.length === 0) return;
    setSubmitting(true);
    setMessage("");
    try {
      const result = await api.startPresent(playlistId, selectedIds);
      setMessage(`Streaming started on ${result.deliveredTo ?? selectedIds.length} screen(s).`);
    } catch (error) {
      console.error(error);
      setMessage("Failed to start presentation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <DashboardHeader title="Present" subtitle="Push content to screens instantly." />
      <main className="p-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : !data?.playlists.length ? (
          <div className="mx-auto max-w-2xl rounded-3xl border border-dashed p-10 text-center text-sm text-gray-500">
            Create a playlist with media first, then come back to present.
          </div>
        ) : !data?.devices.length ? (
          <div className="mx-auto max-w-2xl rounded-3xl border border-dashed p-10 text-center text-sm text-gray-500">
            Add a screen and open its TV link before presenting.
          </div>
        ) : (
          <div className="mx-auto max-w-2xl">
            <div
              className="rounded-3xl border bg-white p-6 shadow-sm"
              style={{ borderColor: "#E5E7EB" }}
            >
              <div className="mb-6 flex items-center gap-2">
                <Presentation className="h-5 w-5 text-[#16a34a]" />
                <h2 className="text-lg font-semibold text-[#042B19]">Live presentation</h2>
              </div>

              <div className="mb-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#042B19]">
                    Select playlist
                  </label>
                  <select
                    className="w-full rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm text-[#042B19] focus:outline-none focus:ring-2 focus:ring-[#042B19]"
                    value={playlistId}
                    onChange={(e) => setPlaylistId(e.target.value)}
                  >
                    {data.playlists.map((playlist) => (
                      <option key={playlist.id} value={playlist.id}>
                        {playlist.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold text-[#042B19]">Target screens</p>
                  <div className="space-y-2">
                    {data.devices.map((screen) => (
                      <label
                        key={screen.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#E5E7EB] p-3 transition hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(screen.id)}
                          onChange={() => toggleDevice(screen.id)}
                          className="h-4 w-4 rounded"
                        />
                        <Monitor className="h-4 w-4 text-gray-500" />
                        <span className="flex-1 text-sm font-medium text-[#042B19]">
                          {screen.name}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 text-xs font-semibold capitalize"
                          style={{
                            color: screen.status === "online" ? "#16a34a" : "#6B7280",
                          }}
                        >
                          {screen.status === "online" ? (
                            <Wifi className="h-3 w-3" />
                          ) : (
                            <WifiOff className="h-3 w-3" />
                          )}
                          {screen.status ?? "offline"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStart}
                disabled={submitting || selectedIds.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#16a34a] px-6 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {submitting ? "Starting..." : "Start presenting"}
              </button>

              {message && (
                <p className="mt-4 text-center text-sm font-medium text-[#16a34a]">{message}</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
