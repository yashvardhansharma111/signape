"use client";

import { useEffect, useState } from "react";
import { Bell, Calendar } from "lucide-react";
import Link from "next/link";
import { api, type Settings } from "@/lib/api";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

export default function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
  }, []);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const initials = settings?.displayName
    ? settings.displayName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "SA";

  return (
    <header
      className="grid grid-cols-1 items-center gap-4 border-b px-6 py-5 md:grid-cols-[minmax(0,1fr)_auto]"
      style={{ borderColor: "#E5E7EB" }}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-[#042B19]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-3 md:justify-end">
        <div className="hidden items-center gap-2 text-sm text-gray-600 lg:flex">
          <Calendar className="h-4 w-4 text-[#042B19]" />
          <span className="whitespace-nowrap">{currentDate}</span>
        </div>

        <button
          type="button"
          className="relative rounded-lg p-2 transition hover:bg-gray-100"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-[#042B19]" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#16a34a]" />
        </button>

        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] px-3 py-2 transition hover:bg-gray-50"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#042B19] text-sm font-semibold text-white">
            {initials}
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold text-[#042B19]">
              {settings?.displayName ?? "AIM4IT User"}
            </p>
            <p className="truncate text-xs text-gray-500">
              {settings?.organization ?? "AIM4IT"}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
