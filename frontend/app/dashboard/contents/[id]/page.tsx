"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Rnd } from "react-rnd";
import {
  ChevronLeft, Save, Type, Image as ImageIcon, Film,
  Trash2, AlignLeft, AlignCenter, AlignRight, Bold, X, Plus,
} from "lucide-react";
import { api, type CanvasElement, type ContentItem, type MediaAsset } from "@/lib/api";

const SCALE = 0.45;

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function ElementRenderer({ el, selected }: { el: CanvasElement; selected: boolean }) {
  if (el.type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={el.url}
        alt={el.mediaName}
        draggable={false}
        className="h-full w-full object-contain"
        style={{ pointerEvents: "none", userSelect: "none" }}
      />
    );
  }
  if (el.type === "video") {
    return (
      <div className="relative h-full w-full bg-black flex items-center justify-center" style={{ pointerEvents: "none" }}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video src={el.url} className="h-full w-full object-contain" muted />
        <Film className="absolute h-8 w-8 text-white/60" />
      </div>
    );
  }
  // text
  return (
    <div
      className="h-full w-full overflow-hidden"
      style={{
        fontSize: el.fontSize,
        fontWeight: el.fontWeight,
        color: el.color,
        textAlign: (el.textAlign as "left" | "center" | "right") ?? "left",
        backgroundColor: el.backgroundColor === "transparent" ? "transparent" : el.backgroundColor,
        padding: "4px",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {el.text || "Text"}
    </div>
  );
}

function MediaPickerModal({
  media,
  onPick,
  onClose,
}: {
  media: MediaAsset[];
  onPick: (m: MediaAsset) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "#E5E7EB" }}>
          <h3 className="font-semibold text-[#042B19]">Choose from Media Library</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {media.filter((m) => m.type !== "document").length === 0 ? (
            <p className="p-6 text-sm text-gray-500 text-center">No images or videos uploaded yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {media.filter((m) => m.type !== "document").map((m) => (
                  <tr
                    key={m.id}
                    className="cursor-pointer border-b hover:bg-gray-50 transition"
                    style={{ borderColor: "#E5E7EB" }}
                    onClick={() => onPick(m)}
                  >
                    <td className="px-4 py-3 w-12">
                      {m.type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt={m.name} className="h-9 w-9 rounded object-cover border" style={{ borderColor: "#E5E7EB" }} />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded bg-gray-100">
                          <Film className="h-4 w-4 text-blue-500" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium truncate max-w-xs" style={{ color: "#042B19" }}>{m.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{m.type}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" className="rounded-lg bg-[#16a34a] px-3 py-1 text-xs font-semibold text-white hover:opacity-90">
                        Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [content, setContent] = useState<ContentItem | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [background, setBackground] = useState("#000000");

  useEffect(() => {
    if (!id) return;
    Promise.all([api.getContent(id), api.getMedia()])
      .then(([c, m]) => {
        setContent(c);
        setElements(c.elements);
        setBackground(c.background);
        setMedia(m);
      })
      .catch(console.error);
  }, [id]);

  const selectedEl = elements.find((e) => e.id === selectedId) ?? null;

  const updateEl = (id: string, patch: Partial<CanvasElement>) => {
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const deleteEl = (id: string) => {
    setElements((prev) => prev.filter((e) => e.id !== id));
    setSelectedId(null);
  };

  const addText = () => {
    const el: CanvasElement = {
      id: genId(), type: "text",
      x: 100, y: 100, width: 400, height: 80,
      text: "Text here", fontSize: 48, fontWeight: "bold",
      color: "#ffffff", textAlign: "left", backgroundColor: "transparent",
    };
    setElements((prev) => [...prev, el]);
    setSelectedId(el.id);
  };

  const addMedia = (m: MediaAsset) => {
    const el: CanvasElement = {
      id: genId(),
      type: m.type === "video" ? "video" : "image",
      x: 50, y: 50, width: 640, height: 360,
      url: m.url, mediaName: m.name,
    };
    setElements((prev) => [...prev, el]);
    setSelectedId(el.id);
    setShowMediaPicker(false);
  };

  const handleSave = async () => {
    if (!content) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.updateContent(content.id, { elements, background });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!content) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">Loading editor...</div>;
  }

  const canvasW = content.canvasWidth * SCALE;
  const canvasH = content.canvasHeight * SCALE;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-100">
      {showMediaPicker && (
        <MediaPickerModal media={media} onPick={addMedia} onClose={() => setShowMediaPicker(false)} />
      )}

      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between border-b bg-white px-4 py-3 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.push("/dashboard/contents")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#042B19]">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <p className="font-semibold text-[#042B19]">{content.name}</p>
          <span className="text-xs text-gray-400">{content.canvasWidth}×{content.canvasHeight}</span>
        </div>

        {/* Toolbar actions */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={addText} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#042B19] hover:bg-gray-50">
            <Type className="h-4 w-4" /> Text
          </button>
          <button type="button" onClick={() => setShowMediaPicker(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#042B19] hover:bg-gray-50">
            <ImageIcon className="h-4 w-4" /> Media
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div className="flex flex-1 items-center justify-center overflow-auto p-8">
          <div
            className="relative shrink-0 overflow-hidden shadow-2xl"
            style={{ width: canvasW, height: canvasH, backgroundColor: background }}
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}
          >
            {elements.map((el) => (
              <Rnd
                key={el.id}
                position={{ x: el.x * SCALE, y: el.y * SCALE }}
                size={{ width: el.width * SCALE, height: el.height * SCALE }}
                onDragStop={(_e, d) => updateEl(el.id, { x: Math.round(d.x / SCALE), y: Math.round(d.y / SCALE) })}
                onResizeStop={(_e, _dir, ref, _delta, pos) => updateEl(el.id, {
                  width: Math.round(parseInt(ref.style.width) / SCALE),
                  height: Math.round(parseInt(ref.style.height) / SCALE),
                  x: Math.round(pos.x / SCALE),
                  y: Math.round(pos.y / SCALE),
                })}
                bounds="parent"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setSelectedId(el.id); }}
                style={{ outline: selectedId === el.id ? "2px solid #16a34a" : "1px solid transparent", cursor: "move" }}
              >
                <ElementRenderer el={el} selected={selectedId === el.id} />
              </Rnd>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="w-64 shrink-0 overflow-y-auto border-l bg-white" style={{ borderColor: "#E5E7EB" }}>
          {/* Canvas settings */}
          <div className="border-b px-4 py-4" style={{ borderColor: "#E5E7EB" }}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Canvas</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Background</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={background} onChange={(e) => setBackground(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-[#E5E7EB] p-0.5" />
                  <span className="text-xs text-gray-400">{background}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400">{content.canvasWidth}×{content.canvasHeight} px</p>
            </div>
          </div>

          {/* Element properties */}
          {selectedEl ? (
            <div className="px-4 py-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {selectedEl.type === "text" ? "Text" : "Media"} element
                </p>
                <button type="button" onClick={() => deleteEl(selectedEl.id)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Position & size */}
              <div className="mb-4 grid grid-cols-2 gap-2">
                {(["x", "y", "width", "height"] as const).map((field) => (
                  <div key={field}>
                    <label className="mb-0.5 block text-xs text-gray-500 uppercase">{field}</label>
                    <input
                      type="number"
                      value={selectedEl[field] as number}
                      onChange={(e) => updateEl(selectedEl.id, { [field]: Number(e.target.value) })}
                      className="w-full rounded border border-[#E5E7EB] px-2 py-1.5 text-xs text-[#042B19] focus:outline-none focus:ring-1 focus:ring-[#042B19]"
                    />
                  </div>
                ))}
              </div>

              {/* Text-specific props */}
              {selectedEl.type === "text" && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Text content</label>
                    <textarea
                      value={selectedEl.text}
                      onChange={(e) => updateEl(selectedEl.id, { text: e.target.value })}
                      rows={3}
                      className="w-full resize-none rounded border border-[#E5E7EB] px-2 py-1.5 text-xs text-[#042B19] focus:outline-none focus:ring-1 focus:ring-[#042B19]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-0.5 block text-xs text-gray-500">Font size</label>
                      <input type="number" value={selectedEl.fontSize} onChange={(e) => updateEl(selectedEl.id, { fontSize: Number(e.target.value) })} className="w-full rounded border border-[#E5E7EB] px-2 py-1.5 text-xs" />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs text-gray-500">Color</label>
                      <input type="color" value={selectedEl.color} onChange={(e) => updateEl(selectedEl.id, { color: e.target.value })} className="h-8 w-full cursor-pointer rounded border border-[#E5E7EB] p-0.5" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Background</label>
                    <input type="color" value={selectedEl.backgroundColor === "transparent" ? "#ffffff" : selectedEl.backgroundColor} onChange={(e) => updateEl(selectedEl.id, { backgroundColor: e.target.value })} className="h-8 w-full cursor-pointer rounded border border-[#E5E7EB] p-0.5" />
                    <button type="button" onClick={() => updateEl(selectedEl.id, { backgroundColor: "transparent" })} className="mt-1 text-xs text-blue-500 hover:underline">Clear (transparent)</button>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Alignment</label>
                    <div className="flex gap-1">
                      {(["left", "center", "right"] as const).map((align) => {
                        const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
                        return (
                          <button
                            key={align}
                            type="button"
                            onClick={() => updateEl(selectedEl.id, { textAlign: align })}
                            className="flex-1 rounded border p-1.5 transition"
                            style={{
                              borderColor: selectedEl.textAlign === align ? "#16a34a" : "#E5E7EB",
                              backgroundColor: selectedEl.textAlign === align ? "#DCFCE7" : "transparent",
                            }}
                          >
                            <Icon className="mx-auto h-4 w-4" style={{ color: selectedEl.textAlign === align ? "#16a34a" : "#6B7280" }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Weight</label>
                    <div className="flex gap-1">
                      {["normal", "bold"].map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => updateEl(selectedEl.id, { fontWeight: w })}
                          className="flex-1 rounded border py-1.5 text-xs capitalize transition"
                          style={{
                            borderColor: selectedEl.fontWeight === w ? "#16a34a" : "#E5E7EB",
                            backgroundColor: selectedEl.fontWeight === w ? "#DCFCE7" : "transparent",
                            color: selectedEl.fontWeight === w ? "#16a34a" : "#6B7280",
                            fontWeight: w,
                          }}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Media name */}
              {(selectedEl.type === "image" || selectedEl.type === "video") && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">File: <span className="font-medium text-[#042B19]">{selectedEl.mediaName}</span></p>
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker(true)}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <Plus className="h-3 w-3" /> Replace media
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-xs text-gray-400">
              Click an element on the canvas to edit its properties
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
