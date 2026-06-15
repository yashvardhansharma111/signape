"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Monitor, Wifi, WifiOff, Plus, Search,
  Copy, ExternalLink, X, LayoutGrid, List, Pencil, Check,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { api, type Device } from "@/lib/api";
import { patchDeviceStatus, useDashboardSocket } from "@/lib/useDashboardSocket";

type ViewMode = "grid" | "list";
type Occupancy = "occupied" | "unoccupied" | null;
type Gender = "male" | "female" | null;

// ── Colour helpers ────────────────────────────────────────────────────────────
const OCCUPANCY_STYLE: Record<"occupied" | "unoccupied", { bg: string; text: string; border: string }> = {
  occupied:   { bg: "#FEE2E2", text: "#dc2626", border: "#dc2626" },
  unoccupied: { bg: "#DCFCE7", text: "#16a34a", border: "#16a34a" },
};
const GENDER_STYLE: Record<"male" | "female", { bg: string; text: string }> = {
  male:   { bg: "#DBEAFE", text: "#1d4ed8" },
  female: { bg: "#FCE7F3", text: "#be185d" },
};

function OccupancyBadge({ value }: { value: Occupancy }) {
  if (!value) return null;
  const s = OCCUPANCY_STYLE[value];
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize" style={{ backgroundColor: s.bg, color: s.text }}>
      {value}
    </span>
  );
}
function GenderBadge({ value }: { value: Gender }) {
  if (!value) return null;
  const s = GENDER_STYLE[value];
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize" style={{ backgroundColor: s.bg, color: s.text }}>
      {value}
    </span>
  );
}

// ── Tag toggle row ────────────────────────────────────────────────────────────
function TagToggle<T extends string>({
  label, options, value, onChange, styles,
}: {
  label: string;
  options: T[];
  value: T | null;
  onChange: (v: T | null) => void;
  styles: Record<T, { bg: string; text: string }>;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-gray-500">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => {
          const active = value === opt;
          const s = styles[opt];
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(active ? null : opt)}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold capitalize transition"
              style={{
                backgroundColor: active ? s.bg : "#F3F4F6",
                color: active ? s.text : "#6B7280",
                border: `1.5px solid ${active ? s.text : "transparent"}`,
              }}
            >
              {active && <Check className="h-3 w-3" />}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({
  device,
  onClose,
  onSaved,
}: {
  device: Device;
  onClose: () => void;
  onSaved: (updated: Device) => void;
}) {
  const [occupancy, setOccupancy] = useState<Occupancy>(device.occupancy);
  const [gender, setGender] = useState<Gender>(device.gender);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateDevice(device.id, { occupancy, gender });
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
          <TagToggle
            label="Occupancy"
            options={["occupied", "unoccupied"]}
            value={occupancy}
            onChange={setOccupancy}
            styles={OCCUPANCY_STYLE}
          />
          <TagToggle
            label="Gender"
            options={["male", "female"]}
            value={gender}
            onChange={setGender}
            styles={GENDER_STYLE}
          />
        </div>

        <div className="flex gap-3 border-t px-5 py-4" style={{ borderColor: "#E5E7EB" }}>
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[#E5E7EB] py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-[#16a34a] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ScreensPage() {
  const [screens, setScreens] = useState<Device[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<{ name: string; location: string; occupancy: Occupancy; gender: Gender }>({
    name: "", location: "", occupancy: null, gender: null,
  });
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  const loadScreens = useCallback(() => {
    setLoading(true);
    api.getDevices(search || undefined)
      .then(setScreens)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { loadScreens(); }, [loadScreens]);

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
      await api.createDevice({
        name: form.name.trim(),
        location: form.location.trim(),
        ...(form.occupancy ? { occupancy: form.occupancy } : {}),
        ...(form.gender ? { gender: form.gender } : {}),
      });
      setForm({ name: "", location: "", occupancy: null, gender: null });
      setShowForm(false);
      loadScreens();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleSaved = (updated: Device) => {
    setScreens((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const isOnline = (s: Device) => s.status === "online";
  const borderColor = (s: Device) => isOnline(s) ? "#16a34a" : "#dc2626";
  const badgeBg = (s: Device) => isOnline(s) ? "#DCFCE7" : "#FEE2E2";
  const badgeText = (s: Device) => isOnline(s) ? "#16a34a" : "#dc2626";

  return (
    <div>
      <DashboardHeader title="Screens" subtitle="Manage displays and monitor connection status." />
      <main className="p-6">
        {editingDevice && (
          <EditModal
            device={editingDevice}
            onClose={() => setEditingDevice(null)}
            onSaved={handleSaved}
          />
        )}

        {/* Toolbar */}
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
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-[#E5E7EB] overflow-hidden">
              {(["grid", "list"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className="flex items-center px-3 py-2 text-sm font-medium transition"
                  style={{ backgroundColor: viewMode === mode ? "#042B19" : "#fff", color: viewMode === mode ? "#fff" : "#6B7280" }}
                >
                  {mode === "grid" ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add screen
            </button>
          </div>
        </div>

        {/* Add screen form */}
        {showForm && (
          <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-[#042B19]">New screen</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400"><X className="h-5 w-5" /></button>
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
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TagToggle
                label="Occupancy"
                options={["occupied", "unoccupied"]}
                value={form.occupancy}
                onChange={(v) => setForm({ ...form, occupancy: v })}
                styles={OCCUPANCY_STYLE}
              />
              <TagToggle
                label="Gender"
                options={["male", "female"]}
                value={form.gender}
                onChange={(v) => setForm({ ...form, gender: v })}
                styles={GENDER_STYLE}
              />
            </div>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="mt-5 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
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
              <div
                key={screen.id}
                className="rounded-2xl bg-white p-5 shadow-sm"
                style={{ border: `2px solid ${borderColor(screen)}` }}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-lg"
                    style={{ backgroundColor: isOnline(screen) ? "#DCFCE7" : "#FEE2E2" }}
                  >
                    <Monitor className="h-5 w-5" style={{ color: borderColor(screen) }} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
                      style={{ backgroundColor: badgeBg(screen), color: badgeText(screen) }}
                    >
                      {isOnline(screen) ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                      {screen.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingDevice(screen)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#042B19] transition"
                      title="Edit tags"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="mb-0.5 text-lg font-bold" style={{ color: "#042B19" }}>{screen.name}</h3>
                <p className="mb-3 text-sm text-gray-500">{screen.location}</p>

                {/* Occupancy + Gender badges */}
                {(screen.occupancy || screen.gender) && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    <OccupancyBadge value={screen.occupancy} />
                    <GenderBadge value={screen.gender} />
                  </div>
                )}

                <div className="space-y-1 border-t pt-3 text-sm" style={{ borderColor: "#E5E7EB" }}>
                  <p className="text-gray-600">Playlist: <span className="font-medium text-gray-900">{screen.playlist || "—"}</span></p>
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
                    <ExternalLink className="h-3.5 w-3.5" /> Open TV view
                  </a>
                </div>
              </div>
            ))}
          </div>

        ) : (

          /* ── LIST VIEW ── */
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-gray-500" style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Tags</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Last Seen</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {screens.map((screen) => (
                  <tr
                    key={screen.id}
                    className="border-b last:border-0 hover:bg-gray-50 transition"
                    style={{ borderColor: "#E5E7EB", borderLeft: `4px solid ${borderColor(screen)}` }}
                  >
                    <td className="px-4 py-4">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
                        style={{ backgroundColor: badgeBg(screen), color: badgeText(screen) }}
                      >
                        {isOnline(screen) ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {screen.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-base" style={{ color: "#042B19" }}>{screen.name}</p>
                      <p className="text-xs text-gray-400">{screen.playlist || "No playlist"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        <OccupancyBadge value={screen.occupancy} />
                        <GenderBadge value={screen.gender} />
                        {!screen.occupancy && !screen.gender && <span className="text-xs text-gray-300">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{screen.location}</td>
                    <td className="px-4 py-4 text-gray-500">{screen.lastSeen}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingDevice(screen)}
                          className="rounded-lg border border-[#E5E7EB] p-1.5 text-gray-400 hover:bg-gray-50 hover:text-[#042B19] transition"
                          title="Edit tags"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => copyDisplayUrl(screen)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#042B19] hover:bg-gray-50"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copiedId === screen.id ? "Copied!" : "Copy link"}
                        </button>
                        <a
                          href={getDisplayUrl(screen)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-[#16a34a] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                        >
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
