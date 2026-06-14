"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#042B19" }}>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? "ml-56" : "ml-20"
        }`}
      >
        <div className="p-3 min-h-screen">
          <div className="bg-white min-h-[calc(100vh-1rem)] rounded-2xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
