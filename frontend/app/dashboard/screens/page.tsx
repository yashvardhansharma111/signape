"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Monitor, Wifi, WifiOff, Plus, Search,
  Copy, ExternalLink, X, LayoutGrid, List, Pencil, Trash2,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { api, type Device, type DevicePreviewItem } from "@/lib/api";
import { patchDeviceStatus, useDashboardSocket } from "@/lib/useDashboardSocket";

type ViewMode = "grid" | "list";

// ── Live preview thumbnail ────────────────────────────────────────────────────
function LivePreview({ items }: { items: DevicePreviewItem[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(id);
  }, [items.length]);

  const base = "h-14 w-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center";

  if (items.length === 0) {
    return (
      <div className={base}>
        <Monitor className="h-5 w-5 text-gray-300" />
      </div>
    );
  }

  const item = items[idx % items.length];

  if (item.type === "image" && item.url) {
    return (
      <div className={base}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
      </div>
    );
  }

  if (item.type === "video" && item.url) {
    return (
      <div className={base}>
        <video
          src={item.url}
          className="h-full w-full object-cover"
          autoPlay muted loop playsInline
        />
      </div>
    );
  }

  // content / canvas item — show background colour with a small icon
  return (
    <div className={base} style={{ backgroundColor: item.background || "#e5e7eb" }}>
      <Monitor className="h-5 w-5 text-white/60" />
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({ device, onClose, onSaved }: {
  device: Device;
  onClose: () => void;
  onSaved: (updated: Device) => void;
}) {
  const [floor,  setFloor]  = useState(device.floor ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateDevice(device.id, { floor: floor.trim() || undefined });
      onSaved(updated);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "#E5E7EB" }}>
          <div>
            <h3 className="font-semibold text-[#042B19]">{device.name}</h3>
            <p className="text-xs text-gray-400">{device.location}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div>
            <p className="mb-1.5 text-xs font-medium text-gray-500">Floor</p>
            <input
              type="text"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="e.g. Ground Floor"
              className="w-full rounded-lg border border-[#E5E7EB] px-4 py-2.5 text-sm text-[#042B19] focus:outline-none focus:ring-2 focus:ring-[#042B19]"
            />
          </div>
        </div>

        <div className="flex gap-3 border-t px-5 py-4" style={{ borderColor: "#E5E7EB" }}>
          <button type="button" onClick={onClose}
            className="flex-1 rounded-lg border border-[#E5E7EB] py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="flex-1 rounded-lg bg-[#16a34a] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ScreensPage() {
  const [screens,       setScreens]       = useState<Device[]>([]);
  const [previews,      setPreviews]      = useState<Map<string, DevicePreviewItem[]>>(new Map());
  const [search,        setSearch]        = useState("");
  const [loading,       setLoading]       = useState(true);
  const [copiedId,      setCopiedId]      = useState<string | null>(null);
  const [showForm,      setShowForm]      = useState(false);
  const [creating,      setCreating]      = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deletingId,    setDeletingId]    = useState<string | null>(null);
  const [viewMode,      setViewMode]      = useState<ViewMode>("grid");
  const [form, setForm] = useState({ name: "", location: "", floor: "" });

  const loadPreviews = useCallback(async () => {
    try {
      const data = await api.getDevicePreviews();
      setPreviews(new Map(data.map((d) => [d.deviceId, d.items])));
    } catch { /* silent */ }
  }, []);

  const loadScreens = useCallback(() => {
    setLoading(true);
    api.getDevices(search || undefined)
      .then((devs) => { setScreens(devs); loadPreviews(); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, loadPreviews]);

  useEffect(() => { loadScreens(); }, [loadScreens]);

  // Refresh previews every 30 s independently of full reload
  useEffect(() => {
    const id = setInterval(loadPreviews, 30_000);
    return () => clearInterval(id);
  }, [loadPreviews]);

  useDashboardSocket({
    onDeviceConnected:    ({ deviceId }) => setScreens((p) => patchDeviceStatus(p, deviceId, "online")),
    onDeviceDisconnected: ({ deviceId }) => setScreens((p) => patchDeviceStatus(p, deviceId, "offline")),
  });

  const getDisplayUrl = (s: Device) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/display/${s.id}?token=${s.deviceToken}`;

  const copyDisplayUrl = async (s: Device) => {
    await navigator.clipboard.writeText(getDisplayUrl(s));
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.location.trim()) return;
    setCreating(true);
    try {
      await api.createDevice({
        name:     form.name.trim(),
        location: form.location.trim(),
        ...(form.floor.trim() ? { floor: form.floor.trim() } : {}),
      });
      setForm({ name: "", location: "", floor: "" });
      setShowForm(false);
      loadScreens();
    } catch (e) { console.error(e); }
    finally     { setCreating(false); }
  };

  const handleSaved = (updated: Device) =>
    setScreens((p) => p.map((s) => s.id === updated.id ? updated : s));

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this screen? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.deleteDevice(id);
      setScreens((p) => p.filter((s) => s.id !== id));
    } catch (e) { console.error(e); }
    finally { setDeletingId(null); }
  };

  const isOnline    = (s: Device) => s.status === "online";
  const borderColor = (s: Device) => isOnline(s) ? "#16a34a" : "#dc2626";
  const badgeBg     = (s: Device) => isOnline(s) ? "#DCFCE7" : "#FEE2E2";
  const badgeText   = (s: Device) => isOnline(s) ? "#16a34a" : "#dc2626";

  return (
    <div>
      <DashboardHeader title="Screens" subtitle="Manage displays and monitor connection status." />
      <main className="p-6">
        {editingDevice && (
          <EditModal device={editingDevice} onClose={() => setEditingDevice(null)} onSaved={handleSaved} />
        )}

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search screens..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] py-2.5 pl-10 pr-4 text-sm text-[#042B19] focus:outline-none focus:ring-2 focus:ring-[#042B19]"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex overflow-hidden rounded-lg border border-[#E5E7EB]">
              {(["grid", "list"] as const).map((mode) => (
                <button key={mode} type="button" onClick={() => setViewMode(mode)}
                  className="flex items-center px-3 py-2 text-sm font-medium transition"
                  style={{ backgroundColor: viewMode === mode ? "#042B19" : "#fff", color: viewMode === mode ? "#fff" : "#6B7280" }}>
                  {mode === "grid" ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
              <Plus className="h-4 w-4" /> Add screen
            </button>
          </div>
        </div>

        {/* Add screen form */}
        {showForm && (
          <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-[#042B19]">New screen</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Screen name" className="rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm text-[#042B19]" />
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Location" className="rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm text-[#042B19]" />
              <input type="text" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })}
                placeholder="Floor (e.g. Ground Floor)" className="rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm text-[#042B19]" />
            </div>
            <button type="button" onClick={handleCreate} disabled={creating}
              className="mt-5 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {creating ? "Creating..." : "Create screen"}
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading screens...</p>
        ) : screens.length === 0 ? (
          <div className="rounded-3xl border border-dashed p-10 text-center text-sm text-gray-500" style={{ borderColor: "#E5E7EB" }}>
            No screens yet. Add a screen, then open its TV link on the display device.
          </div>
        ) : viewMode === "grid" ? (

          /* ── GRID VIEW ── */
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {screens.map((screen) => (
              <div key={screen.id} className="rounded-2xl bg-white p-5 shadow-sm"
                style={{ border: `2px solid ${borderColor(screen)}` }}>

                <div className="mb-3 flex items-start justify-between">
                  {/* Live preview thumbnail */}
                  <LivePreview items={previews.get(screen.id) ?? []} />

                  <div className="flex items-center gap-1.5 ml-3">
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
                      style={{ backgroundColor: badgeBg(screen), color: badgeText(screen) }}>
                      {isOnline(screen) ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                      {screen.status}
                    </span>
                    <button type="button" onClick={() => setEditingDevice(screen)} title="Edit screen"
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#042B19] transition">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => handleDelete(screen.id)} disabled={deletingId === screen.id} title="Delete screen"
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="mb-0.5 text-lg font-bold" style={{ color: "#042B19" }}>{screen.name}</h3>
                <p className="mb-4 text-sm text-gray-500">
                  {screen.location}{screen.floor ? ` · ${screen.floor}` : ""}
                </p>

                <div className="space-y-1 border-t pt-3 text-sm" style={{ borderColor: "#E5E7EB" }}>
                  <p className="text-gray-600">Playlist: <span className="font-medium text-gray-900">{screen.playlist || "—"}</span></p>
                  <p className="text-gray-500">Last seen: {screen.lastSeen}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => copyDisplayUrl(screen)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs font-medium text-[#042B19] hover:bg-gray-50">
                    <Copy className="h-3.5 w-3.5" />
                    {copiedId === screen.id ? "Copied!" : "Copy TV link"}
                  </button>
                  <a href={getDisplayUrl(screen)} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-[#16a34a] px-3 py-2 text-xs font-medium text-white hover:opacity-90">
                    <ExternalLink className="h-3.5 w-3.5" /> Open TV view
                  </a>
                </div>
              </div>
            ))}
          </div>

        ) : (

          /* ── LIST VIEW ── */
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: "#E5E7EB" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Live</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Floor</th>
                  <th className="px-4 py-3">Last Seen</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {screens.map((screen) => (
                  <tr key={screen.id} className="border-b last:border-0 hover:bg-gray-50 transition"
                    style={{ borderColor: "#E5E7EB", borderLeft: `4px solid ${borderColor(screen)}` }}>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
                        style={{ backgroundColor: badgeBg(screen), color: badgeText(screen) }}>
                        {isOnline(screen) ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {screen.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <LivePreview items={previews.get(screen.id) ?? []} />
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-base font-bold" style={{ color: "#042B19" }}>{screen.name}</p>
                      <p className="text-xs text-gray-400">{screen.playlist || "No playlist"}</p>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{screen.location}</td>
                    <td className="px-4 py-4 text-gray-500">{screen.floor || "—"}</td>
                    <td className="px-4 py-4 text-gray-500">{screen.lastSeen}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => setEditingDevice(screen)} title="Edit screen"
                          className="rounded-lg border border-[#E5E7EB] p-1.5 text-gray-400 hover:bg-gray-50 hover:text-[#042B19] transition">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDelete(screen.id)} disabled={deletingId === screen.id} title="Delete screen"
                          className="rounded-lg border border-[#E5E7EB] p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => copyDisplayUrl(screen)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#042B19] hover:bg-gray-50">
                          <Copy className="h-3.5 w-3.5" />
                          {copiedId === screen.id ? "Copied!" : "Copy link"}
                        </button>
                        <a href={getDisplayUrl(screen)} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-[#16a34a] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
                          <ExternalLink className="h-3.5 w-3.5" /> Open
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
