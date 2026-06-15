"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Trash2, Pencil, X, Monitor, Check } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { api, type Device, type DeviceGroup } from "@/lib/api";

type EditingGroup = { id: string | null; name: string; deviceIds: string[] };

const EMPTY_EDIT: EditingGroup = { id: null, name: "", deviceIds: [] };

export default function GroupsPage() {
  const [groups, setGroups] = useState<DeviceGroup[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingGroup | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getDeviceGroups(), api.getDevices()])
      .then(([g, d]) => {
        setGroups(g);
        setDevices(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleDevice = (id: string) => {
    if (!editing) return;
    setEditing((prev) =>
      prev
        ? {
            ...prev,
            deviceIds: prev.deviceIds.includes(id)
              ? prev.deviceIds.filter((d) => d !== id)
              : [...prev.deviceIds, id],
          }
        : prev
    );
  };

  const openCreate = () => setEditing({ ...EMPTY_EDIT });
  const openEdit = (g: DeviceGroup) =>
    setEditing({ id: g.id, name: g.name, deviceIds: [...g.deviceIds] });

  const handleSave = async () => {
    if (!editing || !editing.name.trim()) return;
    setSaving(true);
    try {
      if (editing.id) {
        const updated = await api.updateDeviceGroup(editing.id, {
          name: editing.name.trim(),
          deviceIds: editing.deviceIds,
        });
        setGroups((prev) => prev.map((g) => (g.id === editing.id ? updated : g)));
      } else {
        const created = await api.createDeviceGroup({
          name: editing.name.trim(),
          deviceIds: editing.deviceIds,
        });
        setGroups((prev) => [...prev, created]);
      }
      setEditing(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteDeviceGroup(id);
      setGroups((prev) => prev.filter((g) => g.id !== id));
      setDeleteId(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <DashboardHeader
        title="Device Groups"
        subtitle="Organise screens by location or branch for easier management."
      />
      <main className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {groups.length} group{groups.length !== 1 ? "s" : ""}
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New group
          </button>
        </div>

        {/* Modal */}
        {editing && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "#E5E7EB" }}>
                <h2 className="font-semibold text-[#042B19]">
                  {editing.id ? "Edit group" : "New group"}
                </h2>
                <button type="button" onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {(() => {
                // Devices already assigned to OTHER groups (not the one being edited)
                const takenMap = new Map<string, string>(); // deviceId → group name
                for (const g of groups) {
                  if (g.id === editing.id) continue;
                  for (const did of g.deviceIds) takenMap.set(did, g.name);
                }

                return (
                  <div className="space-y-4 px-6 py-5">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">Group name</label>
                      <input
                        type="text"
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        placeholder="e.g. Ground Floor, India Branch"
                        className="w-full rounded-lg border border-[#E5E7EB] px-4 py-2.5 text-sm text-[#042B19] focus:outline-none focus:ring-2 focus:ring-[#042B19]"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Screens ({editing.deviceIds.length} selected)
                      </label>
                      <div
                        className="max-h-52 overflow-y-auto rounded-lg border"
                        style={{ borderColor: "#E5E7EB" }}
                      >
                        {devices.length === 0 ? (
                          <p className="p-4 text-sm text-gray-400">No screens registered yet.</p>
                        ) : (
                          devices.map((device) => {
                            const taken     = takenMap.get(device.id);
                            const selected  = editing.deviceIds.includes(device.id);
                            const disabled  = !!taken;

                            if (disabled) {
                              return (
                                <div
                                  key={device.id}
                                  className="flex w-full items-center gap-3 border-b px-4 py-3 last:border-0 cursor-not-allowed opacity-45"
                                  style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}
                                >
                                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded border" style={{ borderColor: "#D1D5DB" }} />
                                  <Monitor className="h-4 w-4 shrink-0 text-gray-300" />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-400">{device.name}</p>
                                    <p className="text-xs text-gray-400">{device.location}</p>
                                  </div>
                                  <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-gray-400 bg-gray-100">
                                    {taken}
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <button
                                key={device.id}
                                type="button"
                                onClick={() => toggleDevice(device.id)}
                                className="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition hover:bg-gray-50 last:border-0"
                                style={{ borderColor: "#E5E7EB" }}
                              >
                                <div
                                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded border transition"
                                  style={{
                                    borderColor: selected ? "#16a34a" : "#D1D5DB",
                                    backgroundColor: selected ? "#16a34a" : "transparent",
                                  }}
                                >
                                  {selected && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <Monitor className="h-4 w-4 shrink-0 text-gray-400" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-[#042B19]">{device.name}</p>
                                  <p className="text-xs text-gray-400">{device.location}</p>
                                </div>
                                <span
                                  className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                                  style={{
                                    backgroundColor: device.status === "online" ? "#DCFCE7" : "#FEE2E2",
                                    color: device.status === "online" ? "#15803d" : "#dc2626",
                                  }}
                                >
                                  {device.status}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-3 border-t px-6 py-4" style={{ borderColor: "#E5E7EB" }}>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="flex-1 rounded-lg border border-[#E5E7EB] py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !editing.name.trim()}
                  className="flex-1 rounded-lg bg-[#16a34a] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editing.id ? "Save changes" : "Create group"}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : groups.length === 0 ? (
          <div
            className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed"
            style={{ borderColor: "#E5E7EB" }}
          >
            <Users className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No groups yet. Group your screens by location or branch.</p>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> New group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className="rounded-2xl border bg-white shadow-sm"
                style={{ borderColor: "#E5E7EB" }}
              >
                <div className="flex items-start justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F5F0]">
                      <Users className="h-5 w-5 text-[#042B19]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#042B19]">{group.name}</p>
                      <p className="text-xs text-gray-500">
                        {group.devices.length} screen{group.devices.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(group)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#042B19] transition"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {deleteId === group.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(group.id)}
                          className="rounded px-2 py-1 text-xs font-semibold bg-red-600 text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(null)}
                          className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteId(group.id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {group.devices.length > 0 && (
                  <div className="border-t px-5 pb-4" style={{ borderColor: "#E5E7EB" }}>
                    <div className="mt-3 space-y-2">
                      {group.devices.map((device) => (
                        <div key={device.id} className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: device.status === "online" ? "#16a34a" : "#dc2626" }}
                          />
                          <Monitor className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                          <span className="min-w-0 flex-1 truncate text-xs text-gray-700">{device.name}</span>
                          <span className="shrink-0 text-xs text-gray-400">{device.location}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
