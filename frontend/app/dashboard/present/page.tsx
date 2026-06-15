"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Monitor, Play, Square, Wifi, WifiOff, Film, Image as ImageIcon,
  LayoutTemplate, ChevronRight, Presentation,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { api, type ContentItem, type MediaAsset, type Playlist, type PresentResponse } from "@/lib/api";
import { patchDeviceStatus, useDashboardSocket } from "@/lib/useDashboardSocket";

function PlaylistPreview({
  playlist,
  media,
  contents,
}: {
  playlist: Playlist | undefined;
  media: MediaAsset[];
  contents: ContentItem[];
}) {
  if (!playlist) return null;

  const playlistMedia = (playlist.mediaIds ?? [])
    .map((id) => media.find((m) => m.id === id))
    .filter(Boolean) as MediaAsset[];

  const playlistContents = (playlist.contentIds ?? [])
    .map((id) => contents.find((c) => c.id === id))
    .filter(Boolean) as ContentItem[];

  const totalItems = playlistMedia.length + playlistContents.length;

  if (totalItems === 0) {
    return (
      <p className="text-xs text-gray-400">This playlist has no items yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">{totalItems} item{totalItems !== 1 ? "s" : ""} in this playlist</p>
      <div className="max-h-52 space-y-1.5 overflow-y-auto">
        {playlistContents.map((item, i) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border px-3 py-2"
            style={{ borderColor: "#E5E7EB", backgroundColor: "#FAFAFA" }}
          >
            <span className="w-4 shrink-0 text-center text-xs text-gray-400">{i + 1}</span>
            <div
              className="h-8 w-12 shrink-0 rounded"
              style={{ backgroundColor: item.background }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[#042B19]">{item.name}</p>
              <p className="text-[10px] text-gray-400">
                Canvas · {item.canvasWidth}×{item.canvasHeight} · {item.elements.length} element{item.elements.length !== 1 ? "s" : ""}
              </p>
            </div>
            <LayoutTemplate className="h-3.5 w-3.5 shrink-0 text-purple-400" />
          </div>
        ))}
        {playlistMedia.map((item, i) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border px-3 py-2"
            style={{ borderColor: "#E5E7EB", backgroundColor: "#FAFAFA" }}
          >
            <span className="w-4 shrink-0 text-center text-xs text-gray-400">
              {playlistContents.length + i + 1}
            </span>
            {item.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url}
                alt={item.name}
                className="h-8 w-12 shrink-0 rounded object-cover"
              />
            ) : (
              <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded bg-gray-200">
                <Film className="h-4 w-4 text-blue-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[#042B19]">{item.name}</p>
              <p className="text-[10px] capitalize text-gray-400">{item.type}</p>
            </div>
            {item.type === "image" ? (
              <ImageIcon className="h-3.5 w-3.5 shrink-0 text-blue-400" />
            ) : (
              <Film className="h-3.5 w-3.5 shrink-0 text-purple-400" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PublishPage() {
  const [data, setData] = useState<PresentResponse | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [playlistId, setPlaylistId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [message, setMessage] = useState("");

  const loadPresent = useCallback(() => {
    Promise.all([
      api.getPresent(),
      api.getPlaylists(),
      api.getMedia(),
      api.getContents(),
    ])
      .then(([present, pls, m, c]) => {
        setData(present);
        setPlaylists(pls);
        setMedia(m);
        setContents(c);
        setPlaylistId(present.playlistId);
        setSelectedIds(present.deviceIds);
        setIsLive(!!present.startedAt && present.deviceIds.length > 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadPresent(); }, [loadPresent]);

  useDashboardSocket({
    onDeviceConnected: ({ deviceId }) => {
      setData((prev) =>
        prev ? { ...prev, devices: patchDeviceStatus(prev.devices, deviceId, "online") } : prev
      );
    },
    onDeviceDisconnected: ({ deviceId }) => {
      setData((prev) =>
        prev ? { ...prev, devices: patchDeviceStatus(prev.devices, deviceId, "offline") } : prev
      );
    },
    onPresentDelivered: ({ playlistName, deviceIds }) => {
      setMessage(`Published: "${playlistName}" to ${deviceIds.length} screen(s).`);
    },
  });

  const toggleDevice = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleStart = async () => {
    if (!playlistId || selectedIds.length === 0) return;
    setSubmitting(true);
    setMessage("");
    try {
      const result = await api.startPresent(playlistId, selectedIds);
      setIsLive(true);
      setMessage(`Published to ${result.deliveredTo ?? selectedIds.length} screen(s).`);
    } catch (e) {
      console.error(e);
      setMessage("Failed to publish.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStop = async () => {
    setStopping(true);
    setMessage("");
    try {
      await api.stopPresent();
      setIsLive(false);
      setMessage("Stopped on all screens.");
    } catch (e) {
      console.error(e);
      setMessage("Failed to stop.");
    } finally {
      setStopping(false);
    }
  };

  const selectedPlaylist = playlists.find((p) => p.id === playlistId);

  return (
    <div>
      <DashboardHeader title="Publish" subtitle="Push content to screens instantly." />
      <main className="p-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : !data?.playlists.length ? (
          <div className="mx-auto max-w-2xl rounded-3xl border border-dashed p-10 text-center text-sm text-gray-500" style={{ borderColor: "#E5E7EB" }}>
            Create a playlist with media first, then come back to publish.
          </div>
        ) : !data?.devices.length ? (
          <div className="mx-auto max-w-2xl rounded-3xl border border-dashed p-10 text-center text-sm text-gray-500" style={{ borderColor: "#E5E7EB" }}>
            Add a screen and open its TV link before publishing.
          </div>
        ) : (
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left: controls */}
            <div className="rounded-3xl border bg-white p-6 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Presentation className="h-5 w-5 text-[#16a34a]" />
                  <h2 className="text-lg font-semibold text-[#042B19]">Live publishing</h2>
                </div>
                {isLive && (
                  <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    LIVE
                  </span>
                )}
              </div>

              <div className="mb-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#042B19]">Select playlist</label>
                  <select
                    className="w-full rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm text-[#042B19] focus:outline-none focus:ring-2 focus:ring-[#042B19]"
                    value={playlistId}
                    onChange={(e) => setPlaylistId(e.target.value)}
                  >
                    {data.playlists.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
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
                        <span className="flex-1 text-sm font-medium text-[#042B19]">{screen.name}</span>
                        <span
                          className="inline-flex items-center gap-1 text-xs font-semibold capitalize"
                          style={{ color: screen.status === "online" ? "#16a34a" : "#dc2626" }}
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

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={submitting || stopping || selectedIds.length === 0}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#16a34a] px-6 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  {submitting ? "Publishing..." : "Publish Now"}
                </button>
                {isLive && (
                  <button
                    type="button"
                    onClick={handleStop}
                    disabled={stopping || submitting}
                    className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    <Square className="h-4 w-4" />
                    {stopping ? "Stopping..." : "Stop"}
                  </button>
                )}
              </div>

              {message && (
                <p className="mt-4 text-center text-sm font-medium text-[#16a34a]">{message}</p>
              )}
            </div>

            {/* Right: playlist preview */}
            <div className="rounded-3xl border bg-white p-6 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F5F0]">
                  <ChevronRight className="h-4 w-4 text-[#042B19]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#042B19]">Playlist preview</h3>
                  {selectedPlaylist && (
                    <p className="text-xs text-gray-400">{selectedPlaylist.name}</p>
                  )}
                </div>
              </div>

              <PlaylistPreview
                playlist={selectedPlaylist}
                media={media}
                contents={contents}
              />

              {!selectedPlaylist && (
                <p className="text-xs text-gray-400">Select a playlist to preview its contents.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
