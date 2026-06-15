"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Users, Filter, RefreshCw, Building2, UserCheck, UserX,
  ChevronDown, Calendar,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import {
  api,
  type LiveOccupancyDevice,
  type OccupancyFloorStat,
  type OccupancyHistory,
  type OccupancySummary,
} from "@/lib/api";

// ── Color themes ──────────────────────────────────────────────────────────────
const MALE_BG    = "#1e3a8a";   // dark navy blue
const MALE_LIGHT = "#DBEAFE";
const MALE_TEXT  = "#1d4ed8";

const FEMALE_BG    = "#3b0764"; // dark purple
const FEMALE_LIGHT = "#F3E8FF";
const FEMALE_TEXT  = "#7c3aed";

const OCC_RED   = "#dc2626";
const OCC_GREEN = "#16a34a";

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

// ── Stat card ─────────────────────────────────────────────────────────────────
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

// ── Device card ───────────────────────────────────────────────────────────────
function DeviceCard({ device }: { device: LiveOccupancyDevice }) {
  const isMale   = device.gender === "male";
  const isFemale = device.gender === "female";
  const isOcc    = device.occupancy === "occupied";

  const bg     = isMale ? MALE_BG : isFemale ? FEMALE_BG : "#1f2937";
  const accent = isOcc  ? OCC_RED : OCC_GREEN;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg"
      style={{ backgroundColor: bg }}
    >
      {/* top accent stripe */}
      <div className="absolute left-0 top-0 h-1 w-full" style={{ backgroundColor: accent }} />

      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest opacity-60">
            {device.floor || device.location}
          </p>
          <p className="mt-0.5 text-base font-bold leading-tight">{device.name}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
          {isMale   ? <MaleIcon   size={14} color="#fff" />
           : isFemale ? <FemaleIcon size={14} color="#fff" />
           : <Users size={14} color="#fff" />}
        </div>
      </div>

      {/* Occupancy pill */}
      <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
        style={{ backgroundColor: isOcc ? "rgba(220,38,38,0.25)" : "rgba(22,163,74,0.25)", color: isOcc ? "#fca5a5" : "#86efac" }}>
        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: isOcc ? "#fca5a5" : "#86efac" }} />
        {device.occupancy ? (device.occupancy === "occupied" ? "Occupied" : "Vacant") : "Not tagged"}
      </div>

      {/* Gender row */}
      <div className="mt-3 flex items-center gap-1 text-xs opacity-70">
        {isMale   ? <><MaleIcon   size={11} color="#fff" /> Male</>
         : isFemale ? <><FemaleIcon size={11} color="#fff" /> Female</>
         : "Gender unset"}
      </div>

      {/* Online dot */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1 text-[10px] opacity-60">
        <span className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: device.status === "online" ? "#86efac" : "#fca5a5" }} />
        {device.status}
      </div>
    </div>
  );
}

// ── Horizontal bar chart (floor breakdown) ─────────────────────────────────
function FloorChart({ floors }: { floors: OccupancyFloorStat[] }) {
  const max = Math.max(...floors.map((f) => f.total), 1);
  return (
    <div className="space-y-3">
      {floors.length === 0 && <p className="text-xs text-gray-400">No floor data yet.</p>}
      {floors.map((f) => {
        const occPct  = f.total > 0 ? (f.occupied / f.total) * 100 : 0;
        const malePct = f.total > 0 ? (f.male     / f.total) * 100 : 0;
        const femPct  = f.total > 0 ? (f.female   / f.total) * 100 : 0;
        const barW    = (f.total / max) * 100;
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

// ── Timeline bar chart ─────────────────────────────────────────────────────
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
          const occH = maxVal > 0 ? ((b.occupied)   / maxVal) * 120 : 0;
          const vacH = maxVal > 0 ? ((b.unoccupied) / maxVal) * 120 : 0;
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
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: OCC_RED }} /> Occupied</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: OCC_GREEN }} /> Vacant</span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
type StatusFilter = "all" | "occupied" | "unoccupied";
type GenderFilter = "all" | "male" | "female";
type Period       = "day" | "month" | "year";

export default function OccupancyPage() {
  const [summary,  setSummary]  = useState<OccupancySummary | null>(null);
  const [devices,  setDevices]  = useState<LiveOccupancyDevice[]>([]);
  const [floors,   setFloors]   = useState<string[]>([]);
  const [history,  setHistory]  = useState<OccupancyHistory | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
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
      const params = {
        ...(floor  !== "all" ? { floor }  : {}),
        ...(gender !== "all" ? { gender } : {}),
        ...(status !== "all" ? { status } : {}),
      };
      const [sum, devs, fls, hist] = await Promise.all([
        api.getOccupancySummary({ floor: floor !== "all" ? floor : undefined, gender: gender !== "all" ? gender : undefined }),
        api.getOccupancyLive(params),
        api.getOccupancyFloors(),
        api.getOccupancyHistory({ period, date, ...(floor !== "all" ? { floor } : {}), ...(gender !== "all" ? { gender } : {}), ...(status !== "all" ? { status } : {}) }),
      ]);
      setSummary(sum);
      setDevices(devs);
      setFloors(fls);
      setHistory(hist);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [floor, gender, status, period, date]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30s
  useEffect(() => {
    timerRef.current = setInterval(() => load(true), 30_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [load]);

  const filterBtnClass = (active: boolean, color: string) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold transition border ${active ? "text-white" : "text-gray-500 bg-white"}`;

  if (loading) return (
    <div>
      <DashboardHeader title="Occupancy" subtitle="Real-time occupancy monitoring and reporting." />
      <main className="p-6"><p className="text-sm text-gray-500">Loading...</p></main>
    </div>
  );

  const occ = summary ?? { total: 0, occupied: 0, unoccupied: 0, male: 0, female: 0, online: 0, untaggedOccupancy: 0, untaggedGender: 0, floors: [] };
  const occPct  = occ.total > 0 ? Math.round((occ.occupied / occ.total) * 100) : 0;
  const malePct = (occ.male + occ.female) > 0 ? Math.round((occ.male / (occ.male + occ.female)) * 100) : 0;

  return (
    <div>
      <DashboardHeader title="Occupancy" subtitle="Real-time occupancy monitoring and reporting." />
      <main className="p-6 space-y-6">

        {/* ── Filter bar ── */}
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

          {/* Occupancy status */}
          <div className="flex gap-1">
            {([["all", "All"], ["occupied", "Occupied"], ["unoccupied", "Vacant"]] as [StatusFilter, string][]).map(([v, l]) => (
              <button key={v} type="button" onClick={() => setStatus(v)}
                className={filterBtnClass(status === v, OCC_RED)}
                style={status === v ? { backgroundColor: v === "occupied" ? OCC_RED : v === "unoccupied" ? OCC_GREEN : "#042B19", borderColor: "transparent" } : { borderColor: "#E5E7EB" }}>
                {l}
              </button>
            ))}
          </div>

          {/* Gender */}
          <div className="flex gap-1">
            {([["all", "All"], ["male", "Male"], ["female", "Female"]] as [GenderFilter, string][]).map(([v, l]) => (
              <button key={v} type="button" onClick={() => setGender(v)}
                className={filterBtnClass(gender === v, MALE_BG)}
                style={gender === v ? { backgroundColor: v === "male" ? MALE_BG : v === "female" ? FEMALE_BG : "#042B19", borderColor: "transparent" } : { borderColor: "#E5E7EB" }}>
                {l === "Male" && <span className="inline-flex items-center gap-1"><MaleIcon size={10} color={gender === "male" ? "#fff" : MALE_TEXT} />{l}</span>}
                {l === "Female" && <span className="inline-flex items-center gap-1"><FemaleIcon size={10} color={gender === "female" ? "#fff" : FEMALE_TEXT} />{l}</span>}
                {l === "All" && l}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => load(true)} disabled={refreshing}
              className="flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {/* ── Summary stat cards ── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Total Screens" value={occ.total} sub="All devices" bg="#E8F5F0" color="#042B19" icon={<Users size={20} />} />
          <StatCard label="Occupied" value={occ.occupied} sub={`${occPct}% of total`} bg="#FEE2E2" color={OCC_RED} icon={<UserCheck size={20} />} />
          <StatCard label="Vacant" value={occ.unoccupied} sub={`${100 - occPct}% of total`} bg="#DCFCE7" color={OCC_GREEN} icon={<UserX size={20} />} />
          <StatCard label="Male" value={occ.male} sub={`${malePct}% of tagged`} bg={MALE_LIGHT} color={MALE_TEXT}
            icon={<MaleIcon size={20} color={MALE_TEXT} />} />
          <StatCard label="Female" value={occ.female} sub={`${100 - malePct}% of tagged`} bg={FEMALE_LIGHT} color={FEMALE_TEXT}
            icon={<FemaleIcon size={20} color={FEMALE_TEXT} />} />
        </div>

        {/* ── Occupancy ratio bars ── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Occupancy ratio */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
            <p className="mb-3 text-sm font-semibold" style={{ color: "#042B19" }}>Occupancy Ratio</p>
            <div className="mb-2 flex overflow-hidden rounded-full h-6 bg-gray-100">
              {occ.total > 0 && <>
                <div style={{ width: `${(occ.occupied / occ.total) * 100}%`, backgroundColor: OCC_RED }}
                  className="flex items-center justify-center text-[10px] font-bold text-white" title="Occupied">
                  {occPct > 8 ? `${occPct}%` : ""}
                </div>
                <div style={{ width: `${(occ.unoccupied / occ.total) * 100}%`, backgroundColor: OCC_GREEN }}
                  className="flex items-center justify-center text-[10px] font-bold text-white" title="Vacant">
                  {occ.total > 0 && (100 - occPct) > 8 ? `${100 - occPct}%` : ""}
                </div>
                <div style={{ width: `${(occ.untaggedOccupancy / occ.total) * 100}%`, backgroundColor: "#E5E7EB" }} title="Untagged" />
              </>}
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: OCC_RED }} /> Occupied ({occ.occupied})</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: OCC_GREEN }} /> Vacant ({occ.unoccupied})</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-200" /> Untagged ({occ.untaggedOccupancy})</span>
            </div>
          </div>

          {/* Gender ratio */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
            <p className="mb-3 text-sm font-semibold" style={{ color: "#042B19" }}>Gender Ratio</p>
            <div className="mb-2 flex overflow-hidden rounded-full h-6 bg-gray-100">
              {occ.total > 0 && <>
                <div style={{ width: `${(occ.male / occ.total) * 100}%`, backgroundColor: MALE_BG }}
                  className="flex items-center justify-center text-[10px] font-bold text-white" title="Male">
                  {occ.male > 0 && malePct > 8 ? `${malePct}%` : ""}
                </div>
                <div style={{ width: `${(occ.female / occ.total) * 100}%`, backgroundColor: FEMALE_BG }}
                  className="flex items-center justify-center text-[10px] font-bold text-white" title="Female">
                  {occ.female > 0 && (100 - malePct) > 8 ? `${100 - malePct}%` : ""}
                </div>
                <div style={{ width: `${(occ.untaggedGender / occ.total) * 100}%`, backgroundColor: "#E5E7EB" }} title="Untagged" />
              </>}
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: MALE_BG }} /> Male ({occ.male})</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: FEMALE_BG }} /> Female ({occ.female})</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-200" /> Untagged ({occ.untaggedGender})</span>
            </div>
          </div>
        </div>

        {/* ── Live device grid + Floor chart ── */}
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
                {devices.map((d) => <DeviceCard key={d.id} device={d} />)}
              </div>
            )}
          </div>

          {/* Floor breakdown */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold" style={{ color: "#042B19" }}>By Floor</h2>
            </div>
            <FloorChart floors={occ.floors} />
          </div>
        </div>

        {/* ── History timeline ── */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold" style={{ color: "#042B19" }}>Occupancy Trend</h2>
            </div>

            {/* Period tabs */}
            <div className="flex gap-1 rounded-full border border-[#E5E7EB] p-0.5">
              {(["day", "month", "year"] as Period[]).map((p) => (
                <button key={p} type="button" onClick={() => setPeriod(p)}
                  className="rounded-full px-3 py-1 text-xs font-semibold capitalize transition"
                  style={{ backgroundColor: period === p ? "#042B19" : "transparent", color: period === p ? "#fff" : "#6B7280" }}>
                  {p}
                </button>
              ))}
            </div>

            {/* Date picker */}
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
