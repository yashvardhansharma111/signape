"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Users, UserCheck, UserX, Building2, Calendar, ChevronDown } from "lucide-react";
import {
  api,
  type LiveOccupancyDevice,
  type OccupancyFloorStat,
  type OccupancyHistory,
  type OccupancySummary,
} from "@/lib/api";

const MALE_BG    = "#1e3a8a";
const MALE_LIGHT = "#DBEAFE";
const MALE_TEXT  = "#1d4ed8";
const FEMALE_BG    = "#3b0764";
const FEMALE_LIGHT = "#F3E8FF";
const FEMALE_TEXT  = "#7c3aed";
const OCC_RED   = "#dc2626";
const OCC_GREEN = "#16a34a";

function MaleIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="14" r="5" /><line x1="19" y1="5" x2="14.1" y2="9.9" /><polyline points="15 5 19 5 19 9" />
    </svg>
  );
}
function FemaleIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" /><line x1="12" y1="13" x2="12" y2="21" /><line x1="9" y1="18" x2="15" y2="18" />
    </svg>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent: string }) {
  return (
    <div className="rounded-2xl p-5 shadow-sm bg-white border" style={{ borderColor: "#E5E7EB", borderTop: `4px solid ${accent}` }}>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-2 text-4xl font-bold" style={{ color: accent }}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function DeviceCard({ device }: { device: LiveOccupancyDevice }) {
  const isOccupied = device.occupancy === "occupied";
  const accent = isOccupied ? OCC_RED : (device.occupancy === "unoccupied" ? OCC_GREEN : "#9CA3AF");
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm" style={{ borderTop: `3px solid ${accent}`, borderColor: "#E5E7EB" }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#042B19] truncate">{device.name}</p>
          <p className="text-xs text-gray-400 truncate">{device.location}{device.floor ? ` · ${device.floor}` : ""}</p>
        </div>
        <div className={`ml-2 h-2 w-2 flex-shrink-0 rounded-full mt-1.5 ${device.status === "online" ? "bg-green-500" : "bg-red-400"}`} />
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
          style={{
            backgroundColor: device.occupancy === "occupied" ? "#FEE2E2" : device.occupancy === "unoccupied" ? "#DCFCE7" : "#F3F4F6",
            color: device.occupancy === "occupied" ? OCC_RED : device.occupancy === "unoccupied" ? OCC_GREEN : "#9CA3AF",
          }}>
          {device.occupancy === "occupied" ? <UserCheck size={10} /> : <UserX size={10} />}
          {device.occupancy ?? "no tag"}
        </span>
        {device.gender && (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
            style={{
              backgroundColor: device.gender === "male" ? MALE_LIGHT : FEMALE_LIGHT,
              color: device.gender === "male" ? MALE_TEXT : FEMALE_TEXT,
            }}>
            {device.gender === "male" ? <MaleIcon size={10} color={MALE_TEXT} /> : <FemaleIcon size={10} color={FEMALE_TEXT} />}
            {device.gender}
          </span>
        )}
      </div>
    </div>
  );
}

function FloorChart({ floors }: { floors: OccupancyFloorStat[] }) {
  const max = Math.max(1, ...floors.map((f) => f.total));
  return (
    <div className="space-y-3">
      {floors.map((f) => (
        <div key={f.floor}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-[#042B19]">{f.floor}</span>
            <span className="text-gray-400">{f.occupied}/{f.total} occupied</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full" style={{ width: `${(f.occupied / max) * 100}%`, backgroundColor: OCC_RED }} />
          </div>
          <div className="mt-1 flex gap-3 text-xs text-gray-400">
            {f.male > 0    && <span className="text-[#1d4ed8]">♂ {f.male}</span>}
            {f.female > 0  && <span className="text-[#7c3aed]">♀ {f.female}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RoomPage() {
  const [floors, setFloors]           = useState<string[]>([]);
  const [summary, setSummary]         = useState<OccupancySummary | null>(null);
  const [devices, setDevices]         = useState<LiveOccupancyDevice[]>([]);
  const [history, setHistory]         = useState<OccupancyHistory | null>(null);
  const [filterFloor, setFilterFloor] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [period, setPeriod]           = useState("day");
  const [date, setDate]               = useState("");
  const [loading, setLoading]         = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const intervalRef                   = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const [f, s, d, h] = await Promise.all([
        api.getOccupancyFloors(),
        api.getOccupancySummary({ floor: filterFloor !== "all" ? filterFloor : undefined, gender: filterGender !== "all" ? filterGender : undefined }),
        api.getOccupancyLive({ floor: filterFloor !== "all" ? filterFloor : undefined, gender: filterGender !== "all" ? filterGender : undefined, status: filterStatus !== "all" ? filterStatus : undefined }),
        api.getOccupancyHistory({ period, date: date || undefined, floor: filterFloor !== "all" ? filterFloor : undefined, gender: filterGender !== "all" ? filterGender : undefined }),
      ]);
      setFloors(f);
      setSummary(s);
      setDevices(d);
      setHistory(h);
      setLastRefresh(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterFloor, filterStatus, filterGender, period, date]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    intervalRef.current = setInterval(() => { void load(); }, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]);

  const occupiedPct  = summary ? Math.round((summary.occupied  / Math.max(summary.total, 1)) * 100) : 0;
  const malePct      = summary ? Math.round((summary.male      / Math.max(summary.total, 1)) * 100) : 0;
  const femalePct    = summary ? Math.round((summary.female    / Math.max(summary.total, 1)) * 100) : 0;

  // Bar chart max for history
  const histMax = history ? Math.max(1, ...history.buckets.map((b) => b.occupied + b.unoccupied)) : 1;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: "#E5E7EB" }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#042B19" }}>Room Occupancy</h1>
          <p className="mt-1 text-sm text-gray-500">
            Live monitoring · {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : "Loading..."}
          </p>
        </div>
        <button type="button" onClick={() => void load()}
          className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#042B19] hover:bg-gray-50 transition">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <main className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          {/* Floor */}
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Floor</p>
            <div className="relative">
              <select value={filterFloor} onChange={(e) => setFilterFloor(e.target.value)}
                className="appearance-none rounded-lg border px-4 py-2.5 pr-8 text-sm text-[#042B19] focus:outline-none"
                style={{ borderColor: "#E5E7EB" }}>
                <option value="all">All floors</option>
                {floors.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          {/* Status */}
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Status</p>
            <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
              {[["all","All"],["occupied","Occupied"],["unoccupied","Vacant"]].map(([val,label]) => (
                <button key={val} type="button" onClick={() => setFilterStatus(val)}
                  className="px-4 py-2.5 text-sm font-medium transition"
                  style={{ backgroundColor: filterStatus === val ? (val === "occupied" ? OCC_RED : val === "unoccupied" ? OCC_GREEN : "#042B19") : "#fff", color: filterStatus === val ? "#fff" : "#6B7280" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {/* Gender */}
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Gender</p>
            <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
              {[["all","All"],["male","Male"],["female","Female"]].map(([val,label]) => (
                <button key={val} type="button" onClick={() => setFilterGender(val)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition"
                  style={{ backgroundColor: filterGender === val ? (val === "male" ? MALE_BG : val === "female" ? FEMALE_BG : "#042B19") : "#fff", color: filterGender === val ? "#fff" : "#6B7280" }}>
                  {val === "male" && <MaleIcon size={12} color={filterGender === "male" ? "#fff" : "#9CA3AF"} />}
                  {val === "female" && <FemaleIcon size={12} color={filterGender === "female" ? "#fff" : "#9CA3AF"} />}
                  {label}
                </button>
              ))}
            </div>
          </div>
          {/* Period + date */}
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Period</p>
            <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
              {["day","month","year"].map((p) => (
                <button key={p} type="button" onClick={() => setPeriod(p)}
                  className="px-4 py-2.5 text-sm font-medium capitalize transition"
                  style={{ backgroundColor: period === p ? "#042B19" : "#fff", color: period === p ? "#fff" : "#6B7280" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Date</p>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border pl-10 pr-4 py-2.5 text-sm text-[#042B19] focus:outline-none"
                style={{ borderColor: "#E5E7EB" }} />
            </div>
          </div>
        </div>

        {loading ? <p className="text-sm text-gray-400">Loading data...</p> : summary && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <StatCard label="Total Rooms"    value={summary.total}      accent="#042B19" />
              <StatCard label="Occupied"       value={summary.occupied}   accent={OCC_RED}     sub={`${occupiedPct}%`} />
              <StatCard label="Vacant"         value={summary.unoccupied} accent={OCC_GREEN}   sub={`${100-occupiedPct}%`} />
              <StatCard label="Male"           value={summary.male}       accent={MALE_TEXT}   sub={`${malePct}%`} />
              <StatCard label="Female"         value={summary.female}     accent={FEMALE_TEXT} sub={`${femalePct}%`} />
            </div>

            {/* Ratio bars */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
                <p className="mb-3 text-sm font-semibold text-[#042B19]">Occupancy ratio</p>
                <div className="flex overflow-hidden rounded-full h-5">
                  <div style={{ width: `${occupiedPct}%`, backgroundColor: OCC_RED, transition: "width 0.5s" }} />
                  <div className="flex-1" style={{ backgroundColor: OCC_GREEN }} />
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span style={{ color: OCC_RED }}>{occupiedPct}% Occupied</span>
                  <span style={{ color: OCC_GREEN }}>{100-occupiedPct}% Vacant</span>
                </div>
              </div>
              <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
                <p className="mb-3 text-sm font-semibold text-[#042B19]">Gender distribution</p>
                <div className="flex overflow-hidden rounded-full h-5">
                  <div style={{ width: `${malePct}%`, backgroundColor: MALE_BG, transition: "width 0.5s" }} />
                  <div style={{ width: `${femalePct}%`, backgroundColor: FEMALE_BG }} />
                  <div className="flex-1 bg-gray-100" />
                </div>
                <div className="mt-2 flex justify-between text-xs">
                  <span style={{ color: MALE_TEXT }}>♂ {malePct}% Male</span>
                  <span style={{ color: FEMALE_TEXT }}>♀ {femalePct}% Female</span>
                </div>
              </div>
            </div>

            {/* Device grid + floor breakdown */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <p className="mb-3 text-sm font-semibold text-[#042B19]">
                  Live Status <span className="ml-1 text-xs text-gray-400">({devices.length} rooms)</span>
                </p>
                {devices.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-gray-400" style={{ borderColor: "#E5E7EB" }}>
                    No rooms match the current filters
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {devices.map((d) => <DeviceCard key={d.id} device={d} />)}
                  </div>
                )}
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold text-[#042B19]">Floor Breakdown</p>
                <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
                  {summary.floors.length > 0
                    ? <FloorChart floors={summary.floors} />
                    : <p className="text-xs text-gray-400">No floor data</p>}
                </div>
              </div>
            </div>

            {/* History chart */}
            {history && history.buckets.length > 0 && (
              <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
                <p className="mb-4 text-sm font-semibold text-[#042B19]">
                  Occupancy Over Time <span className="text-xs font-normal text-gray-400 ml-1 capitalize">({period})</span>
                </p>
                <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
                  {history.buckets.map((b) => {
                    const totalH = ((b.occupied + b.unoccupied) / histMax) * 100;
                    const occH   = (b.occupied / histMax) * 100;
                    return (
                      <div key={b._id} className="group relative flex flex-1 min-w-[28px] flex-col items-center justify-end h-full gap-px">
                        <div className="w-full flex flex-col justify-end rounded-t overflow-hidden" style={{ height: `${totalH}%`, minHeight: 2 }}>
                          <div style={{ height: `${b.occupied > 0 ? (occH / totalH) * 100 : 0}%`, backgroundColor: OCC_RED }} />
                          <div className="flex-1" style={{ backgroundColor: OCC_GREEN }} />
                        </div>
                        <span className="text-[9px] text-gray-400 mt-1 truncate max-w-full">{b.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm inline-block" style={{ backgroundColor: OCC_RED }} /> Occupied</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm inline-block" style={{ backgroundColor: OCC_GREEN }} /> Vacant</span>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
