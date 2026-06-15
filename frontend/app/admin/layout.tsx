"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAccessToken } from "@/lib/auth";
import { LogOut, Users, LayoutDashboard } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    clearAccessToken();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#042B19" }}>
      {/* Top navigation */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg font-bold text-white"
              style={{ backgroundColor: "#16a34a" }}>
              A
            </div>
            <div>
              <span className="text-lg font-bold text-white">AIM4IT</span>
              <span className="ml-2 rounded-md px-2 py-0.5 text-xs font-semibold text-white"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                Super Admin
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link href="/admin"
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${pathname === "/admin" ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
              <Users className="h-4 w-4" /> Users
            </Link>
            <Link href="/dashboard"
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition">
              <LayoutDashboard className="h-4 w-4" /> SignApe
            </Link>
          </div>
        </div>

        <button type="button" onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </nav>

      <main className="p-6">
        <div className="mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
