"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Users, Filter, RefreshCw, Building2, UserCheck, UserX,
  ChevronDown, Calendar, Pencil, X,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import {
  api,
  type LiveOccupancyDevice,
  type OccupancyFloorStat,
  type OccupancyHistory,
  type OccupancySummary,
} from "@/lib/api";

// Badge / filter colours — identical to Screens page
const OCC = {
  occupied:   { bg: "#FEE2E2", text: "#dc2626", border: "#dc2626" },
  unoccupied: { bg: "#DCFCE7", text: "#16a34a", border: "#16a34a" },
};
const GEN = {
  male:   { bg: "#DBEAFE", text: "#1d4ed8", border: "#1d4ed8" },
  female: { bg: "#FCE7F3", text: "#be185d", border: "#be185d" },
};
const NEUTRAL = { bg: "#F3F4F6", text: "#9CA3AF", border: "#E5E7EB" };

const OCC_RED    = "#dc2626";
const OCC_GREEN  = "#16a34a";
const MALE_TEXT  = "#1d4ed8";
const FEMALE_TEXT = "#be185d";
const MALE_LIGHT  = "#DBEAFE";
const FEMALE_LIGHT = "#FCE7F3";

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

function OccupancyBadge({ value }: { value: "occupied" | "unoccupied" | null }) {
  const s = value ? OCC[value] : NEUTRAL;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.text, border: `1.5px solid ${s.border}` }}>
      {value === "occupied"   && <UserCheck size={12} />}
      {value === "unoccupied" && <UserX size={12} />}
      {!value && <UserX size={12} style={{ opacity: 0.4 }} />}
      {value === "unoccupied" ? "Vacant" : (value ?? "no tag")}
    </span>
  );
}

function GenderBadge({ value }: { value: "male" | "female" | null }) {
  const s = value ? GEN[value] : NEUTRAL;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
      style={{ backgroundColor: s.bg, color: s.text, border: `1.5px solid ${s.border}` }}>
      {value === "male"   && <MaleIcon size={12} color={s.text} />}
      {value === "female" && <FemaleIcon size={12} color={s.text} />}
      {!value && <MaleIcon size={12} color={NEUTRAL.text} />}
      {value ?? "gender"}
    </span>
  );
}

function StatCard({ label, value, sub, bg, color, icon }: {
  label: string; value: number; sub: string; bg: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: bg }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ color: "#042B19" }}>{value}</p>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="mt-1 text-xs text-gray-400">{sub}</p>
    </div>
  );
}

function DeviceCard({ device, onEdit }: { device: LiveOccupancyDevice; onEdit: () => void }) {
  const accent = device.occupancy === "occupied" ? OCC_RED
    : device.occupancy === "unoccupied" ? OCC_GREEN
    : "#9CA3AF";
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm"
      style={{ borderTop: `3px solid ${accent}`, borderColor: "#E5E7EB" }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 truncate">{device.floor || device.location}</p>
          <p className="mt-0.5 text-sm font-bold text-[#042B19] truncate">{device.name}</p>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <div className={`h-2 w-2 flex-shrink-0 rounded-full ${device.status === "online" ? "bg-green-500" : "bg-red-400"}`} />
          <button type="button" onClick={onEdit} title="Edit tags"
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-[#042B19] transition">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <OccupancyBadge value={device.occupancy} />
        {device.occupancy === "occupied"
          ? <GenderBadge value={device.gender} />
          : <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-gray-400"
              style={{ backgroundColor: "#F3F4F6", border: "1.5px solid #E5E7EB" }}>—</span>
        }
      </div>
    </div>
  );
}

function EditTagModal({ device, onClose, onSaved }: {
  device: LiveOccupancyDevice;
  onClose: () => void;
  onSaved: (id: string, occupancy: "occupied" | "unoccupied" | null, gender: "male" | "female" | null) => void;
}) {
  const [occupancy, setOccupancy] = useState<"occupied" | "unoccupied" | null>(device.occupancy);
  const [gender,    setGender]    = useState<"male" | "female" | null>(device.gender);
  const [saving,    setSaving]    = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateDevice(device.id, { occupancy, gender });
      onSaved(device.id, occupancy, gender);
      onClose();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "#E5E7EB" }}>
          <div>
            <h3 className="font-semibold text-[#042B19]">{device.name}</h3>
            <p className="text-xs text-gray-400">{device.floor || device.location}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          {/* Occupancy */}
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">Occupancy</p>
            <div className="flex gap-2">
              {(["occupied", "unoccupied"] as const).map((v) => {
                const active = occupancy === v;
                const s = active ? OCC[v] : NEUTRAL;
                return (
                  <button key={v} type="button"
                    onClick={() => {
                      const next = active ? null : v;
                      setOccupancy(next);
                      if (next !== "occupied") setGender(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition"
                    style={{ backgroundColor: s.bg, color: s.text, border: `1.5px solid ${s.border}` }}>
                    {v === "occupied" ? <UserCheck size={11} /> : <UserX size={11} />}
                    {v === "unoccupied" ? "Vacant" : v}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gender — only selectable when occupied */}
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">Gender</p>
            {occupancy === "occupied" ? (
              <div className="flex gap-2">
                {(["male", "female"] as const).map((v) => {
                  const active = gender === v;
                  const s = active ? GEN[v] : NEUTRAL;
                  return (
                    <button key={v} type="button"
                      onClick={() => setGender(active ? null : v)}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition"
                      style={{ backgroundColor: s.bg, color: s.text, border: `1.5px solid ${s.border}` }}>
                      {v === "male" ? <MaleIcon size={11} color={s.text} /> : <FemaleIcon size={11} color={s.text} />}
                      {v}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold text-gray-400"
                style={{ backgroundColor: "#F3F4F6", border: "1.5px solid #E5E7EB" }}>—</span>
            )}
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

function FloorChart({ floors }: { floors: OccupancyFloorStat[] }) {
  const max = Math.max(...floors.map((f) => f.total), 1);
  return (
    <div className="space-y-3">
      {floors.length === 0 && <p className="text-xs text-gray-400">No floor data yet.</p>}
      {floors.map((f) => {
        const occPct = f.total > 0 ? (f.occupied / f.total) * 100 : 0;
        const barW   = (f.total / max) * 100;
        return (
          <div key={f.floor}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700">{f.floor || "Unassigned"}</span>
              <span className="text-gray-400">{f.occupied}/{f.total} occupied</span>
            </div>
            <div className="flex h-5 overflow-hidden rounded-full bg-gray-100" style={{ width: `${barW}%`, minWidth: "40px" }}>
              <div style={{ width: `${occPct}%`, backgroundColor: OCC_RED }} title="Occupied" />
              <div style={{ width: `${100 - occPct}%`, backgroundColor: OCC_GREEN }} title="Vacant" />
            </div>
            <div className="mt-1 flex gap-3 text-[10px] text-gray-400">
              <span style={{ color: MALE_TEXT }}>♂ {f.male} male</span>
              <span style={{ color: FEMALE_TEXT }}>♀ {f.female} female</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimelineChart({ history }: { history: OccupancyHistory | null }) {
  if (!history || history.buckets.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-gray-400">
        No history data yet. Occupancy changes will be logged here.
      </div>
    );
  }
  const maxVal = Math.max(...history.buckets.map((b) => b.occupied + b.unoccupied), 1);
  const barW   = Math.max(20, Math.floor(380 / history.buckets.length) - 4);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1 pb-6 pt-2" style={{ minWidth: history.buckets.length * (barW + 4) }}>
        {history.buckets.map((b) => {
          const occH = maxVal > 0 ? (b.occupied   / maxVal) * 120 : 0;
          const vacH = maxVal > 0 ? (b.unoccupied / maxVal) * 120 : 0;
          return (
            <div key={b.label} className="flex flex-col items-center gap-0.5" style={{ width: barW }}>
              <div className="flex w-full flex-col-reverse rounded-sm overflow-hidden" style={{ height: 120 }}>
                <div style={{ height: vacH, backgroundColor: OCC_GREEN }} title={`Vacant: ${b.unoccupied}`} />
                <div style={{ height: occH, backgroundColor: OCC_RED }} title={`Occupied: ${b.occupied}`} />
              </div>
              <span className="text-[9px] text-gray-400 truncate w-full text-center">{b.label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm inline-block" style={{ backgroundColor: OCC_RED }} /> Occupied</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm inline-block" style={{ backgroundColor: OCC_GREEN }} /> Vacant</span>
      </div>
    </div>
  );
}

type StatusFilter = "all" | "occupied" | "unoccupied";
type GenderFilter = "all" | "male" | "female";
type Period       = "day" | "month" | "year";

const ALL_ACTIVE = { bg: "#E8F5F0", text: "#042B19", border: "#042B19" };

export default function OccupancyPage() {
  const [summary,       setSummary]       = useState<OccupancySummary | null>(null);
  const [devices,       setDevices]       = useState<LiveOccupancyDevice[]>([]);
  const [floors,        setFloors]        = useState<string[]>([]);
  const [history,       setHistory]       = useState<OccupancyHistory | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [editingDevice, setEditingDevice] = useState<LiveOccupancyDevice | null>(null);

  const [floor,  setFloor]  = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [gender, setGender] = useState<GenderFilter>("all");
  const [period, setPeriod] = useState<Period>("day");
  const [date,   setDate]   = useState(new Date().toISOString().split("T")[0]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [sum, devs, fls, hist] = await Promise.all([
        api.getOccupancySummary({ floor: floor !== "all" ? floor : undefined, gender: gender !== "all" ? gender : undefined }),
        api.getOccupancyLive({
          ...(floor  !== "all" ? { floor }  : {}),
          ...(gender !== "all" ? { gender } : {}),
          ...(status !== "all" ? { status } : {}),
        }),
        api.getOccupancyFloors(),
        api.getOccupancyHistory({
          period, date,
          ...(floor  !== "all" ? { floor }  : {}),
          ...(gender !== "all" ? { gender } : {}),
          ...(status !== "all" ? { status } : {}),
        }),
      ]);
      setSummary(sum);
      setDevices(devs);
      setFloors(fls);
      setHistory(hist);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [floor, gender, status, period, date]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    timerRef.current = setInterval(() => load(true), 30_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [load]);

  if (loading) return (
    <div>
      <DashboardHeader title="Occupancy" subtitle="Real-time occupancy monitoring and reporting." />
      <main className="p-6"><p className="text-sm text-gray-500">Loading...</p></main>
    </div>
  );

  const occ = summary ?? { total: 0, occupied: 0, unoccupied: 0, male: 0, female: 0, online: 0, untaggedOccupancy: 0, untaggedGender: 0, floors: [] };
  const occPct  = occ.total > 0 ? Math.round((occ.occupied / occ.total) * 100) : 0;
  const malePct = (occ.male + occ.female) > 0 ? Math.round((occ.male / (occ.male + occ.female)) * 100) : 0;

  const statusStyle = (v: StatusFilter) => {
    if (status !== v) return NEUTRAL;
    if (v === "occupied")   return OCC.occupied;
    if (v === "unoccupied") return OCC.unoccupied;
    return ALL_ACTIVE;
  };
  const genderStyle = (v: GenderFilter) => {
    if (gender !== v) return NEUTRAL;
    if (v === "male")   return GEN.male;
    if (v === "female") return GEN.female;
    return ALL_ACTIVE;
  };

  const handleTagSaved = (
    id: string,
    occupancy: "occupied" | "unoccupied" | null,
    gender: "male" | "female" | null,
  ) => {
    setDevices((prev) => prev.map((d) => d.id === id ? { ...d, occupancy, gender } : d));
  };

  return (
    <div>
      <DashboardHeader title="Occupancy" subtitle="Real-time occupancy monitoring and reporting." />
      {editingDevice && (
        <EditTagModal
          device={editingDevice}
          onClose={() => setEditingDevice(null)}
          onSaved={handleTagSaved}
        />
      )}
      <main className="p-6 space-y-6">

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-white px-5 py-4 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
          <Filter className="h-4 w-4 shrink-0 text-gray-400" />

          {/* Floor */}
          <div className="relative">
            <select value={floor} onChange={(e) => setFloor(e.target.value)}
              className="appearance-none rounded-full border border-[#E5E7EB] bg-white py-1.5 pl-3 pr-7 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#042B19]">
              <option value="all">All Floors</option>
              {floors.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Status filter — badge toggle style */}
          <div className="flex gap-2">
            {([
              { v: "all" as StatusFilter,        l: "All",      icon: null },
              { v: "occupied" as StatusFilter,   l: "Occupied", icon: <UserCheck size={11} /> },
              { v: "unoccupied" as StatusFilter, l: "Vacant",   icon: <UserX size={11} /> },
            ]).map(({ v, l, icon }) => {
              const s = statusStyle(v);
              return (
                <button key={v} type="button" onClick={() => setStatus(v)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition"
                  style={{ backgroundColor: s.bg, color: s.text, border: `1.5px solid ${s.border}` }}>
                  {icon}
                  {l}
                </button>
              );
            })}
          </div>

          {/* Gender filter — badge toggle style */}
          <div className="flex gap-2">
            {([
              { v: "all" as GenderFilter,    l: "All",    icon: null },
              { v: "male" as GenderFilter,   l: "Male",   icon: <MaleIcon size={11} color={gender === "male" ? GEN.male.text : NEUTRAL.text} /> },
              { v: "female" as GenderFilter, l: "Female", icon: <FemaleIcon size={11} color={gender === "female" ? GEN.female.text : NEUTRAL.text} /> },
            ]).map(({ v, l, icon }) => {
              const s = genderStyle(v);
              return (
                <button key={v} type="button" onClick={() => setGender(v)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition"
                  style={{ backgroundColor: s.bg, color: s.text, border: `1.5px solid ${s.border}` }}>
                  {icon}
                  {l}
                </button>
              );
            })}
          </div>

          <div className="ml-auto">
            <button type="button" onClick={() => load(true)} disabled={refreshing}
              className="flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Total Screens" value={occ.total}      sub="All devices"         bg="#E8F5F0"      color="#042B19"    icon={<Users size={20} />} />
          <StatCard label="Occupied"      value={occ.occupied}   sub={`${occPct}% of total`}        bg="#FEE2E2"      color={OCC_RED}    icon={<UserCheck size={20} />} />
          <StatCard label="Vacant"        value={occ.unoccupied} sub={`${100 - occPct}% of total`} bg="#DCFCE7"      color={OCC_GREEN}  icon={<UserX size={20} />} />
          <StatCard label="Male"          value={occ.male}       sub={`${malePct}% of tagged`}      bg={MALE_LIGHT}   color={MALE_TEXT}  icon={<MaleIcon size={20} color={MALE_TEXT} />} />
          <StatCard label="Female"        value={occ.female}     sub={`${100 - malePct}% of tagged`} bg={FEMALE_LIGHT} color={FEMALE_TEXT} icon={<FemaleIcon size={20} color={FEMALE_TEXT} />} />
        </div>

        {/* Live device grid + right sidebar */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Device grid */}
          <div className="lg:col-span-2 rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold" style={{ color: "#042B19" }}>
                Live Status · {devices.length} screen{devices.length !== 1 ? "s" : ""}
              </h2>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> Live
              </span>
            </div>
            {devices.length === 0 ? (
              <p className="text-sm text-gray-400">No screens match the selected filters.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {devices.map((d) => <DeviceCard key={d.id} device={d} onEdit={() => setEditingDevice(d)} />)}
              </div>
            )}
          </div>

          {/* Right sidebar: floor chart → occupancy ratio → gender ratio */}
          <div className="space-y-4">

            {/* By Floor */}
            <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
              <div className="mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <h2 className="text-sm font-semibold" style={{ color: "#042B19" }}>By Floor</h2>
              </div>
              <FloorChart floors={occ.floors} />
            </div>

            {/* Occupancy Ratio */}
            <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
              <p className="mb-3 text-sm font-semibold" style={{ color: "#042B19" }}>Occupancy Ratio</p>
              <div className="mb-2 flex overflow-hidden rounded-full h-5 bg-gray-100">
                {occ.total > 0 && <>
                  <div style={{ width: `${(occ.occupied / occ.total) * 100}%`, backgroundColor: OCC_RED }}
                    className="flex items-center justify-center text-[10px] font-bold text-white" title="Occupied">
                    {occPct > 8 ? `${occPct}%` : ""}
                  </div>
                  <div style={{ width: `${(occ.unoccupied / occ.total) * 100}%`, backgroundColor: OCC_GREEN }}
                    className="flex items-center justify-center text-[10px] font-bold text-white" title="Vacant">
                    {(100 - occPct) > 8 ? `${100 - occPct}%` : ""}
                  </div>
                  <div style={{ width: `${(occ.untaggedOccupancy / occ.total) * 100}%`, backgroundColor: "#E5E7EB" }} title="Untagged" />
                </>}
              </div>
              <div className="flex flex-col gap-1 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: OCC_RED }} /> Occupied ({occ.occupied})</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: OCC_GREEN }} /> Vacant ({occ.unoccupied})</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full inline-block bg-gray-200" /> Untagged ({occ.untaggedOccupancy})</span>
              </div>
            </div>

            {/* Gender Ratio */}
            <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
              <p className="mb-3 text-sm font-semibold" style={{ color: "#042B19" }}>Gender Ratio</p>
              <div className="mb-2 flex overflow-hidden rounded-full h-5 bg-gray-100">
                {occ.total > 0 && <>
                  <div style={{ width: `${(occ.male / occ.total) * 100}%`, backgroundColor: GEN.male.border }}
                    className="flex items-center justify-center text-[10px] font-bold text-white" title="Male">
                    {malePct > 8 ? `${malePct}%` : ""}
                  </div>
                  <div style={{ width: `${(occ.female / occ.total) * 100}%`, backgroundColor: GEN.female.border }}
                    className="flex items-center justify-center text-[10px] font-bold text-white" title="Female">
                    {(100 - malePct) > 8 ? `${100 - malePct}%` : ""}
                  </div>
                  <div style={{ width: `${(occ.untaggedGender / occ.total) * 100}%`, backgroundColor: "#E5E7EB" }} title="Untagged" />
                </>}
              </div>
              <div className="flex flex-col gap-1 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: GEN.male.border }} /> Male ({occ.male})</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: GEN.female.border }} /> Female ({occ.female})</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full inline-block bg-gray-200" /> Untagged ({occ.untaggedGender})</span>
              </div>
            </div>

          </div>
        </div>

        {/* History timeline */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold" style={{ color: "#042B19" }}>Occupancy Trend</h2>
            </div>
            <div className="flex gap-1 rounded-full border border-[#E5E7EB] p-0.5">
              {(["day", "month", "year"] as Period[]).map((p) => (
                <button key={p} type="button" onClick={() => setPeriod(p)}
                  className="rounded-full px-3 py-1 text-xs font-semibold capitalize transition"
                  style={{ backgroundColor: period === p ? "#042B19" : "transparent", color: period === p ? "#fff" : "#6B7280" }}>
                  {p}
                </button>
              ))}
            </div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#042B19]"
            />
          </div>
          <TimelineChart history={history} />
        </div>

      </main>
    </div>
  );
}
