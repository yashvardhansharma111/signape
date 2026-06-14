"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Monitor,
  Library,
  ListVideo,
  Calendar,
  Presentation,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { api, type LiveDeviceStats } from "@/lib/api";
import { clearAccessToken } from "@/lib/auth";
import { useDashboardSocket } from "@/lib/useDashboardSocket";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Screens", href: "/dashboard/screens", icon: Monitor },
  { label: "Media library", href: "/dashboard/media-library", icon: Library },
  { label: "Playlists", href: "/dashboard/playlists", icon: ListVideo },
  { label: "Schedule", href: "/dashboard/schedule", icon: Calendar },
  { label: "Present", href: "/dashboard/present", icon: Presentation },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [liveStats, setLiveStats] = useState<LiveDeviceStats>({ live: 0, total: 0 });

  useEffect(() => {
    api.getLiveDevices()
      .then(setLiveStats)
      .catch(() => setLiveStats({ live: 0, total: 0 }));
  }, []);

  useDashboardSocket({
    onLiveStats: setLiveStats,
  });

  const handleLogout = () => {
    clearAccessToken();
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col transition-all duration-300 ${
        isOpen ? "w-56" : "w-20"
      }`}
      style={{ backgroundColor: "#042B19" }}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-5">
        {isOpen ? (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg font-bold text-white"
              style={{ backgroundColor: "#16a34a" }}
            >
              S
            </div>
            <span className="text-lg font-bold text-white">Signape</span>
          </Link>
        ) : (
          <Link href="/dashboard" className="mx-auto">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg font-bold text-white"
              style={{ backgroundColor: "#16a34a" }}
            >
              S
            </div>
          </Link>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                  title={!isOpen ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {isOpen && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 pb-3">
        {isOpen ? (
          <div
            className="rounded-xl p-4 shadow-sm"
            style={{ backgroundColor: "#FEF9C3", border: "1px solid #FDE047" }}
          >
            <div className="mb-2 flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: "#FDE047" }}
              >
                <Monitor className="h-4 w-4" style={{ color: "#854D0E" }} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#854D0E" }}>
                Live devices
              </span>
            </div>
            <p className="text-3xl font-bold" style={{ color: "#042B19" }}>
              {liveStats.live}
            </p>
            <p className="mt-1 text-xs font-medium" style={{ color: "#854D0E" }}>
              {liveStats.live} of {liveStats.total} connected
            </p>
          </div>
        ) : (
          <div
            className="flex flex-col items-center rounded-xl px-2 py-3"
            style={{ backgroundColor: "#FEF9C3", border: "1px solid #FDE047" }}
            title={`${liveStats.live} devices live`}
          >
            <Monitor className="mb-1 h-4 w-4" style={{ color: "#854D0E" }} />
            <span className="text-lg font-bold leading-none" style={{ color: "#042B19" }}>
              {liveStats.live}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white ${
            !isOpen ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
