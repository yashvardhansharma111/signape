"use client";

import "@uploadthing/react/styles.css";
import { useCallback, useEffect, useState } from "react";
import { FileImage, FileText, Film, Trash2, Upload } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { UploadDropzone } from "@/lib/uploadthing";
import { saveMediaToBackend } from "@/lib/media";
import { api, type MediaAsset } from "@/lib/api";

function MediaIcon({ type }: { type: MediaAsset["type"] }) {
  if (type === "image") return <FileImage className="h-8 w-8" style={{ color: "#16a34a" }} />;
  if (type === "video") return <Film className="h-8 w-8" style={{ color: "#3b82f6" }} />;
  return <FileText className="h-8 w-8" style={{ color: "#854D0E" }} />;
}

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

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
      <main className="p-6">
        <div
          className="mb-8 rounded-3xl border bg-white p-6 shadow-sm"
          style={{ borderColor: "#E5E7EB" }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5" style={{ color: "#16a34a" }} />
            <h2 className="text-lg font-semibold" style={{ color: "#042B19" }}>
              Upload files
            </h2>
          </div>
          <UploadDropzone
            endpoint="mediaUploader"
            onUploadBegin={() => {
              setUploadError("");
              setUploading(true);
              console.log("[uploadthing] client upload started");
            }}
            onClientUploadComplete={async (files) => {
              console.log("[uploadthing] client upload complete", files.length, "file(s)");
              try {
                for (const file of files) {
                  await saveMediaToBackend({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    key: file.key,
                    ufsUrl: file.ufsUrl,
                  });
                }
                await loadMedia();
              } catch (error) {
                console.error("[uploadthing] failed to save media metadata", error);
                setUploadError(
                  error instanceof Error ? error.message : "Upload succeeded but saving failed"
                );
              } finally {
                setUploading(false);
              }
            }}
            onUploadError={(error) => {
              console.error("[uploadthing] client upload error", error);
              setUploading(false);
              setUploadError(error.message ?? "Upload failed. Check UPLOADTHING_TOKEN in .env.local");
            }}
            appearance={{
              container: "border-2 border-dashed rounded-2xl p-8 ut-uploading:opacity-60",
              label: "text-sm text-gray-600",
              allowedContent: "text-xs text-gray-500",
              button:
                "bg-[#16a34a] text-white text-sm font-semibold px-4 py-2 rounded-lg ut-ready:bg-[#16a34a] ut-uploading:bg-[#16a34a]",
            }}
          />
          {uploading && (
            <p className="mt-3 text-sm text-gray-600">Uploading...</p>
          )}
          {uploadError && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {uploadError}
            </p>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading media...</p>
        ) : media.length === 0 ? (
          <div
            className="flex min-h-[240px] items-center justify-center rounded-3xl border border-dashed"
            style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}
          >
            <p className="text-sm text-gray-500">No media uploaded yet. Drop files above to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {media.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                style={{ borderColor: "#E5E7EB" }}
              >
                <div
                  className="flex h-36 items-center justify-center"
                  style={{ backgroundColor: "#F9FAFB" }}
                >
                  {item.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <MediaIcon type={item.type} />
                  )}
                </div>
                <div className="p-4">
                  <p className="truncate font-semibold" style={{ color: "#042B19" }}>
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs capitalize text-gray-500">
                    {item.type} · {item.sizeKb} KB
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium"
                      style={{ color: "#16a34a" }}
                    >
                      View file
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
