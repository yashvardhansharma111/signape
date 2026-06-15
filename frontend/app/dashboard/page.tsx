"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Monitor, Library, ListVideo, Calendar, ArrowRight, Wifi, WifiOff, Play,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { api, type Device, type DeviceTagStats, type OverviewResponse } from "@/lib/api";
import { patchDeviceStatus, useDashboardSocket } from "@/lib/useDashboardSocket";

// ── SVG Donut (up to 3 segments) ─────────────────────────────────────────────
interface Segment { value: number; color: string; label: string }

function DonutChart({
  segments, centerLabel, centerSub, size = 130, strokeW = 16,
}: {
  segments: Segment[];
  centerLabel: string;
  centerSub: string;
  size?: number;
  strokeW?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r  = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  let offset = 0;
  const arcs = segments.map((seg) => {
    const len   = total > 0 ? (seg.value / total) * circ : 0;
    const arc   = { ...seg, len, offset };
    offset += len;
    return arc;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth={strokeW} />
      {total > 0 && arcs.map((arc) =>
        arc.len > 0 ? (
          <circle
            key={arc.label}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeW}
            strokeDasharray={`${arc.len} ${circ}`}
            strokeDashoffset={-arc.offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ) : null
      )}
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="18" fontWeight="700" fill="#042B19">{centerLabel}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#6B7280">{centerSub}</text>
    </svg>
  );
}

function Legend({ segments, total }: { segments: Segment[]; total: number }) {
  return (
    <div className="flex-1 space-y-2.5">
      {segments.map((seg) => (
        <div key={seg.label} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-gray-600">{seg.label}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold" style={{ color: seg.color }}>{seg.value}</span>
            <span className="text-[10px] text-gray-400">
              {total > 0 ? `${Math.round((seg.value / total) * 100)}%` : "0%"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Screen Status card ────────────────────────────────────────────────────────
function ScreenStatusCard({ screens }: { screens: Device[] }) {
  const online  = screens.filter((s) => s.status === "online").length;
  const offline = screens.filter((s) => s.status === "offline").length;

  const segments: Segment[] = [
    { value: online,  color: "#16a34a", label: "Online"  },
    { value: offline, color: "#dc2626", label: "Offline" },
  ];

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: "#042B19" }}>Screen Status</h2>
        <Link href="/dashboard/screens" className="text-sm font-medium" style={{ color: "#16a34a" }}>View all</Link>
      </div>
      {screens.length === 0 ? (
        <p className="text-sm text-gray-500">No screens yet.</p>
      ) : (
        <>
          <div className="mb-5 flex items-center gap-5">
            <DonutChart segments={segments} centerLabel={String(online + offline)} centerSub="Total" />
            <Legend segments={segments} total={online + offline} />
          </div>
          <div className="space-y-2">
            {screens.map((screen) => (
              <div key={screen.id} className="flex items-center justify-between rounded-lg border p-3"
                style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}>
                <div className="flex items-center gap-3">
                  {screen.status === "online"
                    ? <Wifi className="h-4 w-4 text-[#16a34a]" />
                    : <WifiOff className="h-4 w-4 text-[#dc2626]" />}
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#042B19" }}>{screen.name}</p>
                    <p className="text-xs text-gray-500">{screen.location}</p>
                  </div>
                </div>
                <span className="rounded-full px-2 py-1 text-xs font-semibold capitalize"
                  style={{
                    backgroundColor: screen.status === "online" ? "#DCFCE7" : "#FEE2E2",
                    color: screen.status === "online" ? "#16a34a" : "#dc2626",
                  }}>
                  {screen.status}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Occupancy chart card ──────────────────────────────────────────────────────
function OccupancyCard({ tags }: { tags: DeviceTagStats }) {
  const segments: Segment[] = [
    { value: tags.occupied,         color: "#dc2626", label: "Occupied"   },
    { value: tags.unoccupied,       color: "#16a34a", label: "Unoccupied" },
    { value: tags.untaggedOccupancy, color: "#E5E7EB", label: "Not tagged" },
  ];
  const pct = tags.total > 0 ? Math.round((tags.occupied / tags.total) * 100) : 0;

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: "#042B19" }}>Occupancy</h2>
        <Link href="/dashboard/screens" className="text-sm font-medium" style={{ color: "#16a34a" }}>View all</Link>
      </div>
      <div className="mb-4 flex items-center gap-5">
        <DonutChart
          segments={segments}
          centerLabel={`${pct}%`}
          centerSub="Occupied"
        />
        <Legend segments={segments} total={tags.total} />
      </div>
      {/* Bar */}
      <div className="rounded-full overflow-hidden h-2 bg-[#F3F4F6]">
        <div
          className="h-2 rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: "#dc2626",
          }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-gray-400">
        <span>{tags.occupied} occupied</span>
        <span>{tags.unoccupied} unoccupied</span>
      </div>
    </div>
  );
}

// ── Gender chart card ─────────────────────────────────────────────────────────
function GenderCard({ tags }: { tags: DeviceTagStats }) {
  const segments: Segment[] = [
    { value: tags.male,          color: "#1d4ed8", label: "Male"      },
    { value: tags.female,        color: "#be185d", label: "Female"    },
    { value: tags.untaggedGender, color: "#E5E7EB", label: "Not tagged" },
  ];
  const tagged = tags.male + tags.female;
  const malePct   = tagged > 0 ? Math.round((tags.male   / tagged) * 100) : 0;
  const femalePct = tagged > 0 ? Math.round((tags.female / tagged) * 100) : 0;

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: "#042B19" }}>Gender</h2>
        <Link href="/dashboard/screens" className="text-sm font-medium" style={{ color: "#16a34a" }}>View all</Link>
      </div>
      <div className="mb-4 flex items-center gap-5">
        <DonutChart
          segments={segments}
          centerLabel={String(tagged)}
          centerSub="Tagged"
        />
        <Legend segments={segments} total={tags.total} />
      </div>
      {/* Split bar */}
      <div className="flex rounded-full overflow-hidden h-2 bg-[#F3F4F6]">
        {tagged > 0 ? (
          <>
            <div style={{ width: `${malePct}%`, backgroundColor: "#1d4ed8" }} />
            <div style={{ width: `${femalePct}%`, backgroundColor: "#be185d" }} />
          </>
        ) : null}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-gray-400">
        <span>{tags.male} male</span>
        <span>{tags.female} female</span>
      </div>
    </div>
  );
}

// ── Quick Present card ────────────────────────────────────────────────────────
function QuickPresentCard({ playlist, selected, total }: { playlist: string; selected: number; total: number }) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
      <div className="mb-6 flex items-center gap-2">
        <Play className="h-5 w-5 text-[#16a34a]" />
        <h2 className="text-lg font-semibold" style={{ color: "#042B19" }}>Quick Publish</h2>
      </div>
      <p className="mb-6 text-sm text-gray-600">
        Push content to screens instantly without changing your schedule.
      </p>
      <div className="mb-6 space-y-4">
        <div>
          <p className="mb-1 text-sm font-medium text-gray-600">Now playing</p>
          <p className="font-semibold" style={{ color: "#042B19" }}>{playlist}</p>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-gray-600">Target screens</p>
          <p className="font-semibold" style={{ color: "#042B19" }}>{selected} of {total} selected</p>
        </div>
      </div>
      <Link href="/dashboard/present"
        className="flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition hover:opacity-90"
        style={{ backgroundColor: "#16a34a" }}>
        <Play className="h-4 w-4" /> Open Publish
      </Link>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = useCallback(() => {
    api.getOverview().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  useDashboardSocket({
    onLiveStats: (stats) => {
      setData((prev) => prev ? {
        ...prev,
        liveDevices: stats,
        stats: { ...prev.stats, activeScreens: stats.live, offlineScreens: stats.total - stats.live },
      } : prev);
    },
    onDeviceConnected: ({ deviceId }) => {
      setData((prev) => prev ? { ...prev, recentScreens: patchDeviceStatus(prev.recentScreens, deviceId, "online") } : prev);
    },
    onDeviceDisconnected: ({ deviceId }) => {
      setData((prev) => prev ? { ...prev, recentScreens: patchDeviceStatus(prev.recentScreens, deviceId, "offline") } : prev);
    },
  });

  const stats = data ? [
    { title: "Active Screens", description: "Currently online",   value: String(data.stats.activeScreens), change: `${data.stats.offlineScreens} offline`,            icon: Monitor,  color: "#3b82f6", bgColor: "#DBEAFE" },
    { title: "Media Assets",   description: "Images, videos & files", value: String(data.stats.mediaAssets), change: `+${data.stats.mediaAddedThisWeek} this week`,  icon: Library,  color: "#16a34a", bgColor: "#DCFCE7" },
    { title: "Playlists",      description: "Ready to publish",   value: String(data.stats.playlists),     change: `${data.stats.draftPlaylists} drafts`,             icon: ListVideo, color: "#eab308", bgColor: "#FEF9C3" },
    { title: "Scheduled",      description: "Upcoming playback",  value: String(data.stats.scheduled),     change: `Next in ${data.stats.nextScheduleIn}`,            icon: Calendar, color: "#ec4899", bgColor: "#FCE7F3" },
  ] : [];

  const quickLinks = data ? [
    { title: "Screens",       description: "Manage displays and check connection status.", value: `${data.liveDevices.total} connected`, href: "/dashboard/screens",      icon: Monitor  },
    { title: "Media Library", description: "Upload and organize your content assets.",     value: `${data.stats.mediaAssets} files`,     href: "/dashboard/media-library", icon: Library  },
    { title: "Playlists",     description: "Build and edit content playlists.",             value: `${data.stats.playlists} playlists`,  href: "/dashboard/playlists",     icon: ListVideo },
    { title: "Schedule",      description: "Plan when content plays on each screen.",       value: `${data.stats.scheduled} scheduled`,  href: "/dashboard/schedule",      icon: Calendar },
  ] : [];

  const emptyTags: DeviceTagStats = { total: 0, occupied: 0, unoccupied: 0, untaggedOccupancy: 0, male: 0, female: 0, untaggedGender: 0 };

  return (
    <div>
      <DashboardHeader title="Overview" subtitle="Monitor screens, content, and playback across your network." />
      <main className="p-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading overview...</p>
        ) : (
          <>
            {/* Stat cards */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.title} className="rounded-3xl border bg-white p-6 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
                    <div className="mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: stat.bgColor }}>
                        <Icon className="h-6 w-6" style={{ color: stat.color }} />
                      </div>
                    </div>
                    <h3 className="mb-1 text-sm font-semibold text-gray-600">{stat.title}</h3>
                    <p className="mb-2 text-3xl font-bold" style={{ color: "#042B19" }}>{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.description}</p>
                    <p className="mt-2 text-sm font-medium" style={{ color: "#16a34a" }}>{stat.change}</p>
                  </div>
                );
              })}
            </div>

            {/* Quick links */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {quickLinks.map((section) => {
                const Icon = section.icon;
                return (
                  <Link key={section.title} href={section.href}
                    className="rounded-3xl border bg-white p-6 shadow-sm transition hover:shadow-md"
                    style={{ borderColor: "#E5E7EB" }}>
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: "#E8F5F0" }}>
                        <Icon className="h-6 w-6" style={{ color: "#042B19" }} />
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold" style={{ color: "#042B19" }}>{section.title}</h3>
                    <p className="mb-4 text-sm text-gray-600">{section.description}</p>
                    <p className="text-base font-semibold" style={{ color: "#042B19" }}>{section.value}</p>
                  </Link>
                );
              })}
            </div>

            {/* Screen status + Quick publish */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ScreenStatusCard screens={data?.recentScreens ?? []} />
              <QuickPresentCard
                playlist={data?.quickPresent.playlist ?? "—"}
                selected={data?.quickPresent.selectedDevices ?? 0}
                total={data?.quickPresent.totalDevices ?? 0}
              />
            </div>

            {/* Occupancy + Gender charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <OccupancyCard tags={data?.deviceTags ?? emptyTags} />
              <GenderCard    tags={data?.deviceTags ?? emptyTags} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
