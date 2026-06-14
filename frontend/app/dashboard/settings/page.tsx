"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { api, type Settings } from "@/lib/api";

export default function SettingsPage() {
  const [formData, setFormData] = useState<Settings>({
    displayName: "",
    email: "",
    organization: "",
    timezone: "America/New_York",
    notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then(setFormData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await api.updateSettings(formData);
      setFormData(updated);
      setSaved(true);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <DashboardHeader
        title="Settings"
        subtitle="Manage your account and application preferences."
      />
      <main className="p-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading settings...</p>
        ) : (
          <div className="mx-auto max-w-2xl space-y-6">
            <section
              className="rounded-3xl border bg-white p-6 shadow-sm"
              style={{ borderColor: "#E5E7EB" }}
            >
              <h2 className="mb-4 text-lg font-semibold" style={{ color: "#042B19" }}>
                Profile
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600">
                    Display name
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#042B19]"
                    style={{ borderColor: "#E5E7EB", color: "#042B19" }}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#042B19]"
                    style={{ borderColor: "#E5E7EB", color: "#042B19" }}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#042B19]"
                    style={{ borderColor: "#E5E7EB", color: "#042B19" }}
                  />
                </div>
              </div>
            </section>

            <section
              className="rounded-3xl border bg-white p-6 shadow-sm"
              style={{ borderColor: "#E5E7EB" }}
            >
              <h2 className="mb-4 text-lg font-semibold" style={{ color: "#042B19" }}>
                Preferences
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600">
                    Timezone
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#042B19]"
                    style={{ borderColor: "#E5E7EB", color: "#042B19" }}
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <label
                  className="flex cursor-pointer items-center justify-between rounded-lg border p-4"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#042B19" }}>
                      Screen notifications
                    </p>
                    <p className="text-xs text-gray-500">Alert when a screen goes offline</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notifications}
                    onChange={(e) => setFormData({ ...formData, notifications: e.target.checked })}
                    className="h-4 w-4"
                  />
                </label>
              </div>
            </section>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-lg px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#16a34a" }}
            >
              {saving ? "Saving..." : saved ? "Saved!" : "Save changes"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
