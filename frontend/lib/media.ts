import { getAuthHeaders } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export function getMediaType(mimeType: string): "image" | "video" | "document" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

export async function saveMediaToBackend(file: {
  name: string;
  type: string;
  size: number;
  key: string;
  ufsUrl: string;
}) {
  console.log("[media] saving to backend", { name: file.name, key: file.key });

  const response = await fetch(`${API_BASE}/api/media`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      name: file.name,
      type: getMediaType(file.type),
      sizeKb: Math.round(file.size / 1024),
      url: file.ufsUrl,
      key: file.key,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    console.error("[media] backend save failed", response.status, body);
    throw new Error(body.error ?? "Failed to save media metadata");
  }

  const saved = await response.json();
  console.log("[media] saved to backend", saved.id ?? saved);
  return saved;
}
