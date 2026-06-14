"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, Plus, Trash2 } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { api, type Device, type Playlist, type Schedule } from "@/lib/api";

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    playlistId: "",
    deviceIds: [] as string[],
    startsAt: "",
    endsAt: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.getSchedules(), api.getPlaylists(), api.getDevices()])
      .then(([scheduleData, playlistData, deviceData]) => {
        setSchedules(scheduleData);
        setPlaylists(playlistData);
        setDevices(deviceData);
        setForm((prev) => ({
          ...prev,
          playlistId: prev.playlistId || playlistData[0]?.id || "",
        }));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleDevice = (id: string) => {
    setForm((prev) => ({
      ...prev,
      deviceIds: prev.deviceIds.includes(id)
        ? prev.deviceIds.filter((deviceId) => deviceId !== id)
        : [...prev.deviceIds, id],
    }));
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.playlistId || !form.startsAt || !form.endsAt) return;
    setCreating(true);
    try {
      await api.createSchedule({
        ...form,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
      });
      setForm({
        name: "",
        playlistId: playlists[0]?.id ?? "",
        deviceIds: [],
        startsAt: "",
        endsAt: "",
      });
      load();
    } catch (error) {
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteSchedule(id);
      load();
    } catch (error) {
      console.error(error);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <div>
      <DashboardHeader
        title="Schedule"
        subtitle="Plan when playlists play on each screen."
      />
      <main className="p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <section
            className="rounded-3xl border bg-white p-6 shadow-sm"
            style={{ borderColor: "#E5E7EB" }}
          >
            <h2 className="mb-4 text-lg font-semibold text-[#042B19]">New schedule</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Schedule name"
                className="w-full rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm text-[#042B19] focus:outline-none focus:ring-2 focus:ring-[#042B19]"
              />
              <select
                value={form.playlistId}
                onChange={(e) => setForm({ ...form, playlistId: e.target.value })}
                className="w-full rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm text-[#042B19]"
              >
                <option value="">Select playlist</option>
                {playlists.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  className="rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm text-[#042B19]"
                />
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  className="rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm text-[#042B19]"
                />
              </div>
              {devices.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Target screens</p>
                  {devices.map((device) => (
                    <label key={device.id} className="flex items-center gap-2 text-sm text-[#042B19]">
                      <input
                        type="checkbox"
                        checked={form.deviceIds.includes(device.id)}
                        onChange={() => toggleDevice(device.id)}
                      />
                      {device.name}
                    </label>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating || !form.name.trim() || !form.playlistId}
                className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {creating ? "Creating..." : "Create schedule"}
              </button>
            </div>
          </section>

          {loading ? (
            <p className="text-sm text-gray-500">Loading schedules...</p>
          ) : schedules.length === 0 ? (
            <div
              className="rounded-3xl border border-dashed p-10 text-center text-sm text-gray-500"
              style={{ borderColor: "#E5E7EB" }}
            >
              No schedules yet. Create a playlist and screen first.
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between rounded-2xl border bg-white p-5 shadow-sm"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FCE7F3]">
                      <Calendar className="h-5 w-5 text-[#ec4899]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#042B19]">{schedule.name}</p>
                      <p className="text-sm text-gray-500">
                        {schedule.playlist} · {formatDate(schedule.startsAt)} → {formatDate(schedule.endsAt)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {schedule.devices.map((d) => d.name).join(", ") || "No screens"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(schedule.id)}
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete schedule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
