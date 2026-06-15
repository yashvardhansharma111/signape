"use client";

import { useCallback, useEffect, useState } from "react";
import { ListVideo, Plus, Trash2, Film, Image as ImageIcon, LayoutTemplate, X, Check } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { api, type ContentItem, type MediaAsset, type Playlist } from "@/lib/api";

type Tab = "media" | "content";

interface NewPlaylistState {
  name: string;
  selectedMedia: string[];
  selectedContent: string[];
  tab: Tab;
}

const EMPTY: NewPlaylistState = { name: "", selectedMedia: [], selectedContent: [], tab: "media" };

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<NewPlaylistState>(EMPTY);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.getPlaylists(), api.getMedia(), api.getContents()])
      .then(([p, m, c]) => {
        setPlaylists(p);
        setMedia(m.filter((a) => a.type !== "document"));
        setContents(c);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleMedia = (id: string) =>
    setForm((f) => ({
      ...f,
      selectedMedia: f.selectedMedia.includes(id)
        ? f.selectedMedia.filter((x) => x !== id)
        : [...f.selectedMedia, id],
    }));

  const toggleContent = (id: string) =>
    setForm((f) => ({
      ...f,
      selectedContent: f.selectedContent.includes(id)
        ? f.selectedContent.filter((x) => x !== id)
        : [...f.selectedContent, id],
    }));

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await api.createPlaylist({
        name: form.name.trim(),
        status: "published",
        mediaIds: form.selectedMedia,
        contentIds: form.selectedContent,
      });
      setForm(EMPTY);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deletePlaylist(id);
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const totalSelected = form.selectedMedia.length + form.selectedContent.length;

  return (
    <div>
      <DashboardHeader
        title="Playlists"
        subtitle="Create playlists from media files and canvas content layouts."
      />
      <main className="p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* New playlist form */}
          <section className="rounded-3xl border bg-white p-6 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
            <h2 className="mb-4 text-lg font-semibold text-[#042B19]">New playlist</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Playlist name"
                className="w-full rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm text-[#042B19] focus:outline-none focus:ring-2 focus:ring-[#042B19]"
              />

              {/* Tab switcher */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">Add items</p>
                  {totalSelected > 0 && (
                    <span className="text-xs text-gray-400">{totalSelected} selected</span>
                  )}
                </div>
                <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, tab: "media" })}
                    className="flex flex-1 items-center justify-center gap-1.5 py-2 text-sm font-medium transition"
                    style={{
                      backgroundColor: form.tab === "media" ? "#042B19" : "transparent",
                      color: form.tab === "media" ? "#ffffff" : "#6B7280",
                    }}
                  >
                    <Film className="h-3.5 w-3.5" />
                    Media
                    {form.selectedMedia.length > 0 && (
                      <span className="ml-1 rounded-full bg-[#16a34a] px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {form.selectedMedia.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, tab: "content" })}
                    className="flex flex-1 items-center justify-center gap-1.5 py-2 text-sm font-medium transition border-l"
                    style={{
                      borderColor: "#E5E7EB",
                      backgroundColor: form.tab === "content" ? "#042B19" : "transparent",
                      color: form.tab === "content" ? "#ffffff" : "#6B7280",
                    }}
                  >
                    <LayoutTemplate className="h-3.5 w-3.5" />
                    Contents
                    {form.selectedContent.length > 0 && (
                      <span className="ml-1 rounded-full bg-[#16a34a] px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {form.selectedContent.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Media picker */}
              {form.tab === "media" && (
                <div className="max-h-48 overflow-y-auto rounded-lg border" style={{ borderColor: "#E5E7EB" }}>
                  {media.length === 0 ? (
                    <p className="p-4 text-sm text-gray-400">No media uploaded yet.</p>
                  ) : (
                    media.map((item) => {
                      const sel = form.selectedMedia.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleMedia(item.id)}
                          className="flex w-full items-center gap-3 border-b px-3 py-2.5 text-left transition hover:bg-gray-50 last:border-0"
                          style={{ borderColor: "#E5E7EB" }}
                        >
                          <div
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded border transition"
                            style={{
                              borderColor: sel ? "#16a34a" : "#D1D5DB",
                              backgroundColor: sel ? "#16a34a" : "transparent",
                            }}
                          >
                            {sel && <Check className="h-3 w-3 text-white" />}
                          </div>
                          {item.type === "image" ? (
                            <ImageIcon className="h-4 w-4 shrink-0 text-blue-400" />
                          ) : (
                            <Film className="h-4 w-4 shrink-0 text-purple-400" />
                          )}
                          <span className="flex-1 truncate text-sm text-[#042B19]">{item.name}</span>
                          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-500">{item.type}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* Content picker */}
              {form.tab === "content" && (
                <div className="max-h-48 overflow-y-auto rounded-lg border" style={{ borderColor: "#E5E7EB" }}>
                  {contents.length === 0 ? (
                    <p className="p-4 text-sm text-gray-400">No canvas contents created yet.</p>
                  ) : (
                    contents.map((item) => {
                      const sel = form.selectedContent.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleContent(item.id)}
                          className="flex w-full items-center gap-3 border-b px-3 py-2.5 text-left transition hover:bg-gray-50 last:border-0"
                          style={{ borderColor: "#E5E7EB" }}
                        >
                          <div
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded border transition"
                            style={{
                              borderColor: sel ? "#16a34a" : "#D1D5DB",
                              backgroundColor: sel ? "#16a34a" : "transparent",
                            }}
                          >
                            {sel && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <div
                            className="h-6 w-8 shrink-0 rounded"
                            style={{ backgroundColor: item.background }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[#042B19]">{item.name}</p>
                            <p className="text-xs text-gray-400">
                              {item.canvasWidth}×{item.canvasHeight} · {item.elements.length} element{item.elements.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleCreate}
                disabled={creating || !form.name.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {creating ? "Creating..." : "Create playlist"}
              </button>
            </div>
          </section>

          {/* Playlist list */}
          {loading ? (
            <p className="text-sm text-gray-500">Loading playlists...</p>
          ) : playlists.length === 0 ? (
            <div
              className="rounded-3xl border border-dashed p-10 text-center text-sm text-gray-500"
              style={{ borderColor: "#E5E7EB" }}
            >
              No playlists yet. Create your first playlist above.
            </div>
          ) : (
            <div className="space-y-3">
              {playlists.map((playlist) => {
                const mediaCount = playlist.mediaIds?.length ?? 0;
                const contentCount = playlist.contentIds?.length ?? 0;
                return (
                  <div
                    key={playlist.id}
                    className="rounded-2xl border bg-white p-5 shadow-sm"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F5F0]">
                          <ListVideo className="h-5 w-5 text-[#042B19]" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#042B19]">{playlist.name}</p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: playlist.status === "published" ? "#DCFCE7" : "#F3F4F6",
                                color: playlist.status === "published" ? "#15803d" : "#6B7280",
                              }}
                            >
                              {playlist.status}
                            </span>
                            {mediaCount > 0 && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Film className="h-3 w-3" /> {mediaCount}
                              </span>
                            )}
                            {contentCount > 0 && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <LayoutTemplate className="h-3 w-3" /> {contentCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {deleteId === playlist.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(playlist.id)}
                            className="rounded px-2 py-1 text-xs font-semibold bg-red-600 text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(null)}
                            className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteId(playlist.id)}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
