"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Monitor, Wifi, WifiOff, Plus, Search,
  Copy, ExternalLink, X, LayoutGrid, List, Pencil, Check,
  UserCheck, UserX,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { api, type Device } from "@/lib/api";
import { patchDeviceStatus, useDashboardSocket } from "@/lib/useDashboardSocket";

type ViewMode = "grid" | "list";
type Occupancy = "occupied" | "unoccupied" | null;
type Gender = "male" | "female" | null;

// ── Male / Female SVG icons ───────────────────────────────────────────────────
function MaleIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="14" r="5" />
      <line x1="19" y1="5" x2="14.1" y2="9.9" />
      <polyline points="15 5 19 5 19 9" />
    </svg>
  );
}
function FemaleIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" />
      <line x1="12" y1="13" x2="12" y2="21" />
      <line x1="9" y1="18" x2="15" y2="18" />
    </svg>
  );
}

// ── Badge colours ─────────────────────────────────────────────────────────────
const OCC: Record<"occupied" | "unoccupied", { bg: string; text: string; border: string }> = {
  occupied:   { bg: "#FEE2E2", text: "#dc2626", border: "#dc2626" },
  unoccupied: { bg: "#DCFCE7", text: "#16a34a", border: "#16a34a" },
};
const GEN: Record<"male" | "female", { bg: string; text: string; border: string }> = {
  male:   { bg: "#DBEAFE", text: "#1d4ed8", border: "#1d4ed8" },
  female: { bg: "#FCE7F3", text: "#be185d", border: "#be185d" },
};
const NEUTRAL = { bg: "#F3F4F6", text: "#9CA3AF", border: "#E5E7EB" };

// ── Inline badge components ───────────────────────────────────────────────────
function OccupancyBadge({ value }: { value: Occupancy }) {
  console.log("[OccupancyBadge] value=", value, typeof value);
  const s = value ? OCC[value] : NEUTRAL;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
      style={{ backgroundColor: s.bg, color: s.text, border: `1.5px solid ${s.border}` }}
    >
      {value === "occupied"   && <UserCheck size={12} />}
      {value === "unoccupied" && <UserX size={12} />}
      {!value && <UserX size={12} style={{ opacity: 0.4 }} />}
      {value ?? "occupancy"}
    </span>
  );
}

function GenderBadge({ value }: { value: Gender }) {
  console.log("[GenderBadge] value=", value, typeof value);
  const s = value ? GEN[value] : NEUTRAL;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
      style={{ backgroundColor: s.bg, color: s.text, border: `1.5px solid ${s.border}` }}
    >
      {value === "male"   && <MaleIcon size={12} color={s.text} />}
      {value === "female" && <FemaleIcon size={12} color={s.text} />}
      {!value && <MaleIcon size={12} color={NEUTRAL.text} />}
      {value ?? "gender"}
    </span>
  );
}

// ── Tag toggle helper ─────────────────────────────────────────────────────────
function TagToggle<T extends string>({
  label, options, value, onChange, styles, icons,
}: {
  label: string;
  options: T[];
  value: T | null;
  onChange: (v: T | null) => void;
  styles: Record<T, { bg: string; text: string; border: string }>;
  icons: Record<T, React.ReactNode>;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-gray-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt;
          const s = active ? styles[opt] : NEUTRAL;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(active ? null : opt)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition"
              style={{ backgroundColor: s.bg, color: s.text, border: `1.5px solid ${s.border}` }}
            >
              {active && <Check size={11} />}
              {!active && icons[opt]}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({ device, onClose, onSaved }: {
  device: Device;
  onClose: () => void;
  onSaved: (updated: Device) => void;
}) {
  const [occupancy, setOccupancy] = useState<Occupancy>(device.occupancy);
  const [gender, setGender]       = useState<Gender>(device.gender);
  const [saving, setSaving]       = useState(false);

  const handleSave = async () => {
    setSaving(true);
    console.log("[EditModal] Saving device:", device.id, { occupancy, gender });
    try {
      const updated = await api.updateDevice(device.id, { occupancy, gender });
      console.log("[EditModal] API response:", updated);
      console.log("[EditModal] occupancy in response:", updated.occupancy, "| gender:", updated.gender);
      onSaved(updated);
      onClose();
    } catch (e) {
      console.error("[EditModal] Save failed:", e);
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
            options={["occupied", "unoccupied"] as const}
            value={occupancy}
            onChange={setOccupancy}
            styles={OCC}
            icons={{ occupied: <UserCheck size={11} />, unoccupied: <UserX size={11} /> }}
          />
          <TagToggle
            label="Gender"
            options={["male", "female"] as const}
            value={gender}
            onChange={setGender}
            styles={GEN}
            icons={{
              male:   <MaleIcon size={11} color={NEUTRAL.text} />,
              female: <FemaleIcon size={11} color={NEUTRAL.text} />,
            }}
          />
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
  const [screens, setScreens]           = useState<Device[]>([]);
  const [search, setSearch]             = useState("");
  const [loading, setLoading]           = useState(true);
  const [copiedId, setCopiedId]         = useState<string | null>(null);
  const [showForm, setShowForm]         = useState(false);
  const [creating, setCreating]         = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [viewMode, setViewMode]         = useState<ViewMode>("grid");
  const [form, setForm] = useState<{ name: string; location: string; occupancy: Occupancy; gender: Gender }>({
    name: "", location: "", occupancy: null, gender: null,
  });

  const loadScreens = useCallback(() => {
    setLoading(true);
    api.getDevices(search || undefined)
      .then(setScreens).catch(console.error).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { loadScreens(); }, [loadScreens]);

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
        name: form.name.trim(), location: form.location.trim(),
        ...(form.occupancy ? { occupancy: form.occupancy } : {}),
        ...(form.gender    ? { gender:    form.gender    } : {}),
      });
      setForm({ name: "", location: "", occupancy: null, gender: null });
      setShowForm(false);
      loadScreens();
    } catch (e) { console.error(e); }
    finally     { setCreating(false); }
  };

  const handleSaved = (updated: Device) => {
    console.log("[ScreensPage] handleSaved called with:", updated);
    setScreens((p) => p.map((s) => {
      if (s.id === updated.id) {
        console.log("[ScreensPage] Replacing screen:", s.id, "occupancy:", updated.occupancy, "gender:", updated.gender);
        return updated;
      }
      return s;
    }));
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
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Screen name" className="rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm text-[#042B19]" />
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Location" className="rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm text-[#042B19]" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TagToggle label="Occupancy" options={["occupied", "unoccupied"] as const}
                value={form.occupancy} onChange={(v) => setForm({ ...form, occupancy: v })}
                styles={OCC} icons={{ occupied: <UserCheck size={11} />, unoccupied: <UserX size={11} /> }} />
              <TagToggle label="Gender" options={["male", "female"] as const}
                value={form.gender} onChange={(v) => setForm({ ...form, gender: v })}
                styles={GEN} icons={{
                  male:   <MaleIcon size={11} color={NEUTRAL.text} />,
                  female: <FemaleIcon size={11} color={NEUTRAL.text} />,
                }} />
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

                {/* Header row */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg"
                    style={{ backgroundColor: isOnline(screen) ? "#DCFCE7" : "#FEE2E2" }}>
                    <Monitor className="h-5 w-5" style={{ color: borderColor(screen) }} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
                      style={{ backgroundColor: badgeBg(screen), color: badgeText(screen) }}>
                      {isOnline(screen) ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                      {screen.status}
                    </span>
                    <button type="button" onClick={() => setEditingDevice(screen)} title="Edit tags"
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#042B19] transition">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="mb-0.5 text-lg font-bold" style={{ color: "#042B19" }}>{screen.name}</h3>
                <p className="mb-3 text-sm text-gray-500">{screen.location}</p>

                {/* Occupancy + Gender — always visible */}
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <OccupancyBadge value={screen.occupancy} />
                  <GenderBadge value={screen.gender} />
                </div>

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
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Occupancy</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3">Location</th>
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
                      <p className="text-base font-bold" style={{ color: "#042B19" }}>{screen.name}</p>
                      <p className="text-xs text-gray-400">{screen.playlist || "No playlist"}</p>
                    </td>
                    <td className="px-4 py-4"><OccupancyBadge value={screen.occupancy} /></td>
                    <td className="px-4 py-4"><GenderBadge value={screen.gender} /></td>
                    <td className="px-4 py-4 text-gray-600">{screen.location}</td>
                    <td className="px-4 py-4 text-gray-500">{screen.lastSeen}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => setEditingDevice(screen)} title="Edit tags"
                          className="rounded-lg border border-[#E5E7EB] p-1.5 text-gray-400 hover:bg-gray-50 hover:text-[#042B19] transition">
                          <Pencil className="h-3.5 w-3.5" />
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
