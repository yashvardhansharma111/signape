"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Monitor,
  Library,
  ListVideo,
  Calendar,
  Presentation,
  ArrowRight,
  Wifi,
  WifiOff,
  Play,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { api, type Device, type OverviewResponse } from "@/lib/api";
import { patchDeviceStatus, useDashboardSocket } from "@/lib/useDashboardSocket";

export default function OverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = useCallback(() => {
    api.getOverview()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useDashboardSocket({
    onLiveStats: (stats) => {
      setData((prev) =>
        prev
          ? {
              ...prev,
              liveDevices: stats,
              stats: {
                ...prev.stats,
                activeScreens: stats.live,
                offlineScreens: stats.total - stats.live,
              },
            }
          : prev
      );
    },
    onDeviceConnected: ({ deviceId }) => {
      setData((prev) =>
        prev
          ? {
              ...prev,
              recentScreens: patchDeviceStatus(prev.recentScreens, deviceId, "online"),
            }
          : prev
      );
    },
    onDeviceDisconnected: ({ deviceId }) => {
      setData((prev) =>
        prev
          ? {
              ...prev,
              recentScreens: patchDeviceStatus(prev.recentScreens, deviceId, "offline"),
            }
          : prev
      );
    },
  });

  const stats = data
    ? [
        {
          title: "Active Screens",
          description: "Currently online",
          value: String(data.stats.activeScreens),
          change: `${data.stats.offlineScreens} offline`,
          icon: Monitor,
          color: "#3b82f6",
          bgColor: "#DBEAFE",
        },
        {
          title: "Media Assets",
          description: "Images, videos & files",
          value: String(data.stats.mediaAssets),
          change: `+${data.stats.mediaAddedThisWeek} this week`,
          icon: Library,
          color: "#16a34a",
          bgColor: "#DCFCE7",
        },
        {
          title: "Playlists",
          description: "Ready to publish",
          value: String(data.stats.playlists),
          change: `${data.stats.draftPlaylists} drafts`,
          icon: ListVideo,
          color: "#eab308",
          bgColor: "#FEF9C3",
        },
        {
          title: "Scheduled",
          description: "Upcoming playback",
          value: String(data.stats.scheduled),
          change: `Next in ${data.stats.nextScheduleIn}`,
          icon: Calendar,
          color: "#ec4899",
          bgColor: "#FCE7F3",
        },
      ]
    : [];

  const quickLinks = data
    ? [
        {
          title: "Screens",
          description: "Manage displays and check connection status.",
          value: `${data.liveDevices.total} connected`,
          href: "/dashboard/screens",
          icon: Monitor,
        },
        {
          title: "Media Library",
          description: "Upload and organize your content assets.",
          value: `${data.stats.mediaAssets} files`,
          href: "/dashboard/media-library",
          icon: Library,
        },
        {
          title: "Playlists",
          description: "Build and edit content playlists.",
          value: `${data.stats.playlists} playlists`,
          href: "/dashboard/playlists",
          icon: ListVideo,
        },
        {
          title: "Schedule",
          description: "Plan when content plays on each screen.",
          value: `${data.stats.scheduled} scheduled`,
          href: "/dashboard/schedule",
          icon: Calendar,
        },
      ]
    : [];

  return (
    <div>
      <DashboardHeader
        title="Overview"
        subtitle="Monitor screens, content, and playback across your network."
      />

      <main className="p-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading overview...</p>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.title}
                    className="rounded-3xl border bg-white p-6 shadow-sm"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-lg"
                        style={{ backgroundColor: stat.bgColor }}
                      >
                        <Icon className="h-6 w-6" style={{ color: stat.color }} />
                      </div>
                    </div>
                    <h3 className="mb-1 text-sm font-semibold text-gray-600">{stat.title}</h3>
                    <p className="mb-2 text-3xl font-bold" style={{ color: "#042B19" }}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500">{stat.description}</p>
                    <p className="mt-2 text-sm font-medium" style={{ color: "#16a34a" }}>
                      {stat.change}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {quickLinks.map((section) => {
                const Icon = section.icon;
                return (
                  <Link
                    key={section.title}
                    href={section.href}
                    className="rounded-3xl border bg-white p-6 shadow-sm transition hover:shadow-md"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-lg"
                        style={{ backgroundColor: "#E8F5F0" }}
                      >
                        <Icon className="h-6 w-6" style={{ color: "#042B19" }} />
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold" style={{ color: "#042B19" }}>
                      {section.title}
                    </h3>
                    <p className="mb-4 text-sm text-gray-600">{section.description}</p>
                    <p className="text-base font-semibold" style={{ color: "#042B19" }}>
                      {section.value}
                    </p>
                  </Link>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ScreenStatusCard screens={data?.recentScreens ?? []} />
              <QuickPresentCard
                playlist={data?.quickPresent.playlist ?? "—"}
                selected={data?.quickPresent.selectedDevices ?? 0}
                total={data?.quickPresent.totalDevices ?? 0}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function ScreenStatusCard({ screens }: { screens: Device[] }) {
  return (
    <div
      className="rounded-3xl border bg-white p-6 shadow-sm"
      style={{ borderColor: "#E5E7EB" }}
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold" style={{ color: "#042B19" }}>
          Screen Status
        </h2>
        <Link href="/dashboard/screens" className="text-sm font-medium" style={{ color: "#16a34a" }}>
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {screens.length === 0 ? (
          <p className="text-sm text-gray-500">No screens yet. Add one from the Screens page.</p>
        ) : (
          screens.map((screen) => (
          <div
            key={screen.id}
            className="flex items-center justify-between rounded-lg border p-4"
            style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}
          >
            <div className="flex items-center gap-3">
              {screen.status === "online" ? (
                <Wifi className="h-5 w-5" style={{ color: "#16a34a" }} />
              ) : (
                <WifiOff className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-semibold" style={{ color: "#042B19" }}>
                  {screen.name}
                </p>
                <p className="text-xs text-gray-500">{screen.location}</p>
              </div>
            </div>
            <div className="text-right">
              <span
                className="inline-block rounded-full px-2 py-1 text-xs font-semibold capitalize"
                style={{
                  backgroundColor: screen.status === "online" ? "#DCFCE7" : "#F3F4F6",
                  color: screen.status === "online" ? "#16a34a" : "#6B7280",
                }}
              >
                {screen.status}
              </span>
              <p className="mt-1 text-xs text-gray-500">{screen.playlist}</p>
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
}

function QuickPresentCard({
  playlist,
  selected,
  total,
}: {
  playlist: string;
  selected: number;
  total: number;
}) {
  return (
    <div
      className="rounded-3xl border bg-white p-6 shadow-sm"
      style={{ borderColor: "#E5E7EB" }}
    >
      <div className="mb-6 flex items-center gap-2">
        <Presentation className="h-5 w-5" style={{ color: "#16a34a" }} />
        <h2 className="text-xl font-semibold" style={{ color: "#042B19" }}>
          Quick Present
        </h2>
      </div>
      <p className="mb-6 text-sm text-gray-600">
        Push content to screens instantly without changing your schedule.
      </p>
      <div className="mb-6 space-y-4">
        <div>
          <p className="mb-1 text-sm font-medium text-gray-600">Now playing</p>
          <p className="font-semibold" style={{ color: "#042B19" }}>
            {playlist}
          </p>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-gray-600">Target screens</p>
          <p className="font-semibold" style={{ color: "#042B19" }}>
            {selected} of {total} selected
          </p>
        </div>
      </div>
      <Link
        href="/dashboard/present"
        className="flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition hover:opacity-90"
        style={{ backgroundColor: "#16a34a" }}
      >
        <Play className="h-4 w-4" />
        Open Present
      </Link>
    </div>
  );
}
