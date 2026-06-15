"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutTemplate, Plus, Trash2, Pencil, X } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { api, type ContentItem } from "@/lib/api";

const PRESETS = [
  { label: "Full HD (1920×1080)", w: 1920, h: 1080 },
  { label: "4K (3840×2160)", w: 3840, h: 2160 },
  { label: "Portrait (1080×1920)", w: 1080, h: 1920 },
  { label: "Square (1080×1080)", w: 1080, h: 1080 },
  { label: "Custom", w: 0, h: 0 },
];

export default function ContentsPage() {
  const router = useRouter();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    preset: "Full HD (1920×1080)",
    canvasWidth: 1920,
    canvasHeight: 1080,
    background: "#000000",
  });

  useEffect(() => {
    api.getContents()
      .then(setContents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePreset = (label: string) => {
    const p = PRESETS.find((x) => x.label === label);
    if (!p) return;
    setForm((f) => ({
      ...f,
      preset: label,
      canvasWidth: p.w || f.canvasWidth,
      canvasHeight: p.h || f.canvasHeight,
    }));
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const content = await api.createContent({
        name: form.name.trim(),
        canvasWidth: form.canvasWidth,
        canvasHeight: form.canvasHeight,
        background: form.background,
      });
      router.push(`/dashboard/contents/${content.id}`);
    } catch (error) {
      console.error(error);
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteContent(id);
      setContents((prev) => prev.filter((c) => c.id !== id));
      setDeleteId(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <DashboardHeader
        title="Contents"
        subtitle="Design canvas layouts for your screens."
      />
      <main className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {contents.length} content{contents.length !== 1 ? "s" : ""}
          </p>
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New content
          </button>
        </div>

        {/* New content modal */}
        {showNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "#E5E7EB" }}>
                <h2 className="font-semibold text-[#042B19]">New content</h2>
                <button type="button" onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 px-6 py-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Welcome Screen"
                    className="w-full rounded-lg border border-[#E5E7EB] px-4 py-2.5 text-sm text-[#042B19] focus:outline-none focus:ring-2 focus:ring-[#042B19]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Canvas size</label>
                  <select
                    value={form.preset}
                    onChange={(e) => handlePreset(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] px-4 py-2.5 text-sm text-[#042B19] focus:outline-none focus:ring-2 focus:ring-[#042B19]"
                  >
                    {PRESETS.map((p) => (
                      <option key={p.label} value={p.label}>{p.label}</option>
                    ))}
                  </select>
                </div>
                {form.preset === "Custom" && (
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs text-gray-500">Width (px)</label>
                      <input
                        type="number"
                        value={form.canvasWidth}
                        onChange={(e) => setForm({ ...form, canvasWidth: Number(e.target.value) })}
                        className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-xs text-gray-500">Height (px)</label>
                      <input
                        type="number"
                        value={form.canvasHeight}
                        onChange={(e) => setForm({ ...form, canvasHeight: Number(e.target.value) })}
                        className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Background color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.background}
                      onChange={(e) => setForm({ ...form, background: e.target.value })}
                      className="h-10 w-14 cursor-pointer rounded-lg border border-[#E5E7EB] p-1"
                    />
                    <span className="text-sm text-gray-500">{form.background}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 border-t px-6 py-4" style={{ borderColor: "#E5E7EB" }}>
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="flex-1 rounded-lg border border-[#E5E7EB] py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating || !form.name.trim()}
                  className="flex-1 rounded-lg bg-[#16a34a] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create & edit"}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : contents.length === 0 ? (
          <div
            className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed"
            style={{ borderColor: "#E5E7EB" }}
          >
            <LayoutTemplate className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No contents yet. Create your first canvas layout.</p>
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> New content
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {contents.map((content) => (
              <div
                key={content.id}
                className="group relative rounded-2xl border bg-white shadow-sm overflow-hidden hover:shadow-md transition"
                style={{ borderColor: "#E5E7EB" }}
              >
                {/* Canvas preview thumbnail */}
                <div
                  className="flex h-36 items-center justify-center text-white/30"
                  style={{ backgroundColor: content.background }}
                >
                  <LayoutTemplate className="h-10 w-10" />
                </div>

                <div className="p-4">
                  <p className="truncate font-semibold" style={{ color: "#042B19" }}>{content.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {content.canvasWidth}×{content.canvasHeight} · {content.elements.length} element{content.elements.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex gap-2 border-t px-4 py-3" style={{ borderColor: "#E5E7EB" }}>
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/contents/${content.id}`)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#16a34a] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  {deleteId === content.id ? (
                    <div className="flex gap-1">
                      <button type="button" onClick={() => handleDelete(content.id)} className="rounded px-2 py-1 text-xs font-semibold bg-red-600 text-white hover:bg-red-700">Delete</button>
                      <button type="button" onClick={() => setDeleteId(null)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">Cancel</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteId(content.id)}
                      className="rounded-lg border border-[#E5E7EB] p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
