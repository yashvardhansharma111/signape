"use client";

import { useCallback, useEffect, useState } from "react";
import { ListVideo, Plus, Trash2 } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { api, type MediaAsset, type Playlist } from "@/lib/api";

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.getPlaylists(), api.getMedia()])
      .then(([playlistData, mediaData]) => {
        setPlaylists(playlistData);
        setMedia(mediaData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleMedia = (id: string) => {
    setSelectedMedia((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.createPlaylist({
        name: name.trim(),
        status: "published",
        mediaIds: selectedMedia,
      });
      setName("");
      setSelectedMedia([]);
      load();
    } catch (error) {
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deletePlaylist(id);
      load();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <DashboardHeader
        title="Playlists"
        subtitle="Create and edit content playlists for your screens."
      />
      <main className="p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <section
            className="rounded-3xl border bg-white p-6 shadow-sm"
            style={{ borderColor: "#E5E7EB" }}
          >
            <h2 className="mb-4 text-lg font-semibold text-[#042B19]">New playlist</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Playlist name"
                className="w-full rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm text-[#042B19] focus:outline-none focus:ring-2 focus:ring-[#042B19]"
              />
              {media.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-600">Select media</p>
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-[#E5E7EB] p-3">
                    {media.map((item) => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center gap-2 text-sm text-[#042B19]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMedia.includes(item.id)}
                          onChange={() => toggleMedia(item.id)}
                        />
                        {item.name} ({item.type})
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating || !name.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {creating ? "Creating..." : "Create playlist"}
              </button>
            </div>
          </section>

          {loading ? (
            <p className="text-sm text-gray-500">Loading playlists...</p>
          ) : playlists.length === 0 ? (
            <div
              className="rounded-3xl border border-dashed p-10 text-center text-sm text-gray-500"
              style={{ borderColor: "#E5E7EB" }}
            >
              No playlists yet. Upload media, then create your first playlist.
            </div>
          ) : (
            <div className="space-y-3">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="flex items-center justify-between rounded-2xl border bg-white p-5 shadow-sm"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F5F0]">
                      <ListVideo className="h-5 w-5 text-[#042B19]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#042B19]">{playlist.name}</p>
                      <p className="text-sm text-gray-500">
                        {playlist.itemCount} items · {playlist.status}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(playlist.id)}
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete playlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
