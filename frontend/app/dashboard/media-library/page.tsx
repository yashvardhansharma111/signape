"use client";

import "@uploadthing/react/styles.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { Film, FileImage, FileText, Trash2, Upload, Eye, X, Play } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { UploadDropzone } from "@/lib/uploadthing";
import { saveMediaToBackend } from "@/lib/media";
import { api, type MediaAsset } from "@/lib/api";

function formatSize(kb: number) {
  if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`;
  return `${kb} KB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function TypeIcon({ type }: { type: MediaAsset["type"] }) {
  if (type === "video") return <Film className="h-5 w-5 text-blue-500" />;
  if (type === "image") return <FileImage className="h-5 w-5 text-green-600" />;
  return <FileText className="h-5 w-5 text-yellow-700" />;
}

function TypeBadge({ type }: { type: MediaAsset["type"] }) {
  const styles: Record<MediaAsset["type"], { bg: string; text: string }> = {
    video:    { bg: "#DBEAFE", text: "#1d4ed8" },
    image:    { bg: "#DCFCE7", text: "#16a34a" },
    document: { bg: "#FEF9C3", text: "#854D0E" },
  };
  const s = styles[type];
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {type}
    </span>
  );
}

function PreviewModal({ item, onClose }: { item: MediaAsset; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "#E5E7EB" }}>
          <div className="flex items-center gap-2 min-w-0">
            <TypeIcon type={item.type} />
            <p className="truncate font-semibold text-sm" style={{ color: "#042B19" }}>{item.name}</p>
            <span className="shrink-0 text-xs text-gray-400">{formatSize(item.sizeKb)}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex items-center justify-center bg-black" style={{ minHeight: "360px", maxHeight: "70vh" }}>
          {item.type === "video" ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              src={item.url}
              controls
              autoPlay
              className="max-h-[70vh] w-full object-contain"
            />
          ) : item.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.url}
              alt={item.name}
              className="max-h-[70vh] w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-white/60 py-16">
              <FileText className="h-16 w-16" />
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline text-white/80 hover:text-white"
              >
                Open document
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-gray-500" style={{ borderColor: "#E5E7EB" }}>
          <span>Uploaded {formatDate(item.uploadedAt)}</span>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="font-medium hover:underline"
            style={{ color: "#16a34a" }}
          >
            Open original ↗
          </a>
        </div>
      </div>
    </div>
  );
}

function HoverPreview({ item }: { item: MediaAsset }) {
  if (item.type === "document") return null;
  return (
    <div
      className="pointer-events-none absolute right-24 top-1/2 z-30 -translate-y-1/2 rounded-xl border bg-white shadow-xl overflow-hidden"
      style={{ width: 180, borderColor: "#E5E7EB" }}
    >
      {item.type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.url} alt={item.name} className="h-28 w-full object-cover" />
      ) : (
        <div className="relative flex h-28 w-full items-center justify-center bg-gray-900">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video src={item.url} className="h-full w-full object-cover opacity-70" muted />
          <Play className="absolute h-8 w-8 text-white drop-shadow" />
        </div>
      )}
      <div className="px-3 py-2">
        <p className="truncate text-xs font-medium" style={{ color: "#042B19" }}>{item.name}</p>
        <p className="text-xs text-gray-400">{formatSize(item.sizeKb)}</p>
      </div>
    </div>
  );
}

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaAsset | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      const items = await api.getMedia();
      setMedia(items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteMedia(id);
      setMedia((prev) => prev.filter((item) => item.id !== id));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <DashboardHeader
        title="Media Library"
        subtitle="Upload, organize, and manage your content assets."
      />

      {previewItem && (
        <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
      )}

      <main className="p-6">
        {/* Upload section */}
        <div className="mb-6 rounded-3xl border bg-white p-6 shadow-sm" style={{ borderColor: "#E5E7EB" }}>
          <div className="mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5" style={{ color: "#16a34a" }} />
            <h2 className="text-lg font-semibold" style={{ color: "#042B19" }}>Upload files</h2>
          </div>
          <UploadDropzone
            endpoint="mediaUploader"
            onUploadBegin={() => { setUploadError(""); setUploading(true); }}
            onClientUploadComplete={async (files) => {
              try {
                for (const file of files) {
                  await saveMediaToBackend({ name: file.name, type: file.type, size: file.size, key: file.key, ufsUrl: file.ufsUrl });
                }
                await loadMedia();
              } catch (error) {
                setUploadError(error instanceof Error ? error.message : "Upload succeeded but saving failed");
              } finally {
                setUploading(false);
              }
            }}
            onUploadError={(error) => {
              setUploading(false);
              setUploadError(error.message ?? "Upload failed. Check UPLOADTHING_TOKEN in .env");
            }}
            appearance={{
              container: "border-2 border-dashed rounded-2xl p-8 ut-uploading:opacity-60",
              label: "text-sm text-gray-600",
              allowedContent: "text-xs text-gray-500",
              button: "bg-[#16a34a] text-white text-sm font-semibold px-4 py-2 rounded-lg ut-ready:bg-[#16a34a] ut-uploading:bg-[#16a34a]",
            }}
          />
          {uploading && <p className="mt-3 text-sm text-gray-600">Uploading...</p>}
          {uploadError && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{uploadError}</p>
          )}
        </div>

        {/* Media list */}
        {loading ? (
          <p className="text-sm text-gray-500">Loading media...</p>
        ) : media.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-3xl border border-dashed" style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}>
            <p className="text-sm text-gray-500">No media uploaded yet. Drop files above to get started.</p>
          </div>
        ) : (
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
            {/* Count bar */}
            <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}>
              <p className="text-sm text-gray-500">
                Total: <span className="font-semibold text-[#042B19]">{media.length}</span> items
              </p>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-gray-500" style={{ borderColor: "#E5E7EB" }}>
                  <th className="px-5 py-3 w-10" />
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Size</th>
                  <th className="px-5 py-3">Uploaded</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {media.map((item) => (
                  <tr
                    key={item.id}
                    className="relative border-b last:border-0 transition hover:bg-gray-50"
                    style={{ borderColor: "#E5E7EB" }}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Hover preview */}
                    {hoveredId === item.id && <HoverPreview item={item} />}

                    {/* Type icon */}
                    <td className="px-5 py-4">
                      <TypeIcon type={item.type} />
                    </td>

                    {/* Name */}
                    <td className="px-5 py-4 max-w-xs">
                      <p className="truncate font-medium" style={{ color: "#042B19" }}>{item.name}</p>
                    </td>

                    {/* Type badge */}
                    <td className="px-5 py-4">
                      <TypeBadge type={item.type} />
                    </td>

                    {/* Size */}
                    <td className="px-5 py-4 text-gray-500">{formatSize(item.sizeKb)}</td>

                    {/* Uploaded at */}
                    <td className="px-5 py-4 text-gray-500">{formatDate(item.uploadedAt)}</td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Preview */}
                        <button
                          type="button"
                          onClick={() => setPreviewItem(item)}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Delete */}
                        {deleteConfirmId === item.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="rounded px-2 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="rounded px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
