"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAccessToken } from "@/lib/auth";
import { BarChart3, Settings, LogOut, LayoutDashboard } from "lucide-react";

const SIDEBAR_BG = "#1e0a3c";

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    clearAccessToken();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { label: "Occupancy",  href: "/room",          icon: BarChart3     },
    { label: "Settings",   href: "/room/settings",  icon: Settings      },
  ];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#3b0764" }}>
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col" style={{ backgroundColor: SIDEBAR_BG }}>
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg font-bold text-white"
            style={{ backgroundColor: "#7c3aed" }}>
            A
          </div>
          <div>
            <p className="text-sm font-bold text-white">AIM4IT</p>
            <p className="text-xs text-white/50">Room Occupancy</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map(({ label, href, icon: Icon }) => {
              const active = href === "/room" ? pathname === "/room" : pathname.startsWith(href);
              return (
                <li key={label}>
                  <Link href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-3">
          <button type="button" onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition">
            <LogOut className="h-5 w-5 shrink-0" /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 flex-1">
        <div className="p-3 min-h-screen">
          <div className="bg-white min-h-[calc(100vh-1rem)] rounded-2xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
