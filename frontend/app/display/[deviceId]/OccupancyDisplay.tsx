"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

interface RoomState {
  name: string;
  floor: string;
  occupancy: "occupied" | "unoccupied" | null;
  gender: "male" | "female" | null;
}

function EcgLine() {
  return (
    <svg viewBox="0 0 160 40" className="w-32 h-8 opacity-70" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="0,20 25,20 35,4 45,36 55,4 65,28 75,20 160,20" />
    </svg>
  );
}

function LockIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function UnlockIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

function MaleSymbol({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="14" r="5" />
      <line x1="19" y1="5" x2="14.1" y2="9.9" />
      <polyline points="15 5 19 5 19 9" />
    </svg>
  );
}

function FemaleSymbol({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" />
      <line x1="12" y1="13" x2="12" y2="21" />
      <line x1="9" y1="18" x2="15" y2="18" />
    </svg>
  );
}

export default function OccupancyDisplay({ deviceId, token, initial }: {
  deviceId: string;
  token: string;
  initial: RoomState;
}) {
  const [room, setRoom] = useState<RoomState>(initial);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/display/${deviceId}?token=${encodeURIComponent(token)}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          setRoom({
            name:      data.device.name,
            floor:     data.device.floor ?? "",
            occupancy: data.device.occupancy,
            gender:    data.device.gender,
          });
        }
      } catch { /* silent */ }
    };
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [deviceId, token]);

  const isOccupied = room.occupancy === "occupied";
  const isVacant   = room.occupancy === "unoccupied";

  const genderLabel = isOccupied
    ? (room.gender === "male" ? "M" : room.gender === "female" ? "F" : "_")
    : "_";

  const statusBg   = isOccupied ? "#ea580c" : isVacant ? "#16a34a" : "#4B5563";
  const statusText = isOccupied ? "OCCUPIED" : isVacant ? "VACANT" : "UNTAGGED";

  return (
    <div className="flex min-h-screen flex-col select-none" style={{ backgroundColor: "#0e7490" }}>

      {/* ── Title bar ── */}
      <div className="flex items-center justify-center gap-6 px-8 py-10"
        style={{ backgroundColor: "#0a5f6e", borderBottom: "2px solid rgba(255,255,255,0.1)" }}>
        <EcgLine />
        <div className="text-center">
          <h1 className="text-5xl font-black uppercase tracking-widest text-white leading-tight"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
            {room.name}
          </h1>
          {room.floor && (
            <p className="mt-1 text-lg font-medium tracking-wider text-white/60 uppercase">
              {room.floor}
            </p>
          )}
        </div>
        <EcgLine />
      </div>

      {/* ── Patient info ── */}
      <div className="flex flex-1 flex-col justify-center px-16 py-12"
        style={{ backgroundColor: "#f0fdfa" }}>

        {/* Patient Name */}
        <div className="flex items-center border-b py-8" style={{ borderColor: "#e2e8f0" }}>
          <span className="w-64 text-2xl font-semibold" style={{ color: "#475569" }}>
            Patient Name :
          </span>
          <span className="ml-6 text-4xl font-bold" style={{ color: "#0f172a" }}>
            _
          </span>
        </div>

        {/* Gender */}
        <div className="flex items-center justify-between py-8">
          <div className="flex items-center">
            <span className="w-64 text-2xl font-semibold" style={{ color: "#475569" }}>
              Gender (F/M) :
            </span>
            <span className="ml-6 text-4xl font-bold" style={{ color: "#0f172a" }}>
              {genderLabel}
            </span>
          </div>
          {isOccupied && room.gender && (
            <div style={{ color: room.gender === "female" ? "#be185d" : "#1d4ed8" }}>
              {room.gender === "female" ? <FemaleSymbol size={56} /> : <MaleSymbol size={56} />}
            </div>
          )}
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="flex items-center justify-center gap-6 px-8 py-10"
        style={{ backgroundColor: statusBg, minHeight: "22vh" }}>
        <div style={{ color: "white" }}>
          {isOccupied ? <LockIcon size={56} /> : <UnlockIcon size={56} />}
        </div>
        <span className="text-6xl font-black uppercase tracking-widest text-white"
          style={{ textShadow: "0 2px 10px rgba(0,0,0,0.25)" }}>
          {statusText}
        </span>
      </div>

    </div>
  );
}
