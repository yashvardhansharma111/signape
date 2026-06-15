"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  connectDeviceSocket,
  type PlaybackStartPayload,
  type StreamMediaItem,
  type StreamContentItem,
  type StreamPlaylistItem,
} from "@/lib/socket";

const IMAGE_DURATION_MS = 8000;

function ContentCanvas({ item }: { item: StreamContentItem }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function recalc() {
      if (!containerRef.current) return;
      const pw = window.innerWidth;
      const ph = window.innerHeight;
      setScale(Math.min(pw / item.canvasWidth, ph / item.canvasHeight));
    }
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [item.canvasWidth, item.canvasHeight]);

  return (
    <div className="flex h-screen w-full items-center justify-center overflow-hidden" style={{ backgroundColor: "#000" }}>
      <div
        ref={containerRef}
        style={{
          width: item.canvasWidth,
          height: item.canvasHeight,
          backgroundColor: item.background,
          position: "relative",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          flexShrink: 0,
        }}
      >
        {item.elements.map((el) => (
          <div
            key={el.id}
            style={{
              position: "absolute",
              left: el.x,
              top: el.y,
              width: el.width,
              height: el.height,
              overflow: "hidden",
            }}
          >
            {el.type === "image" && el.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={el.url} alt={el.mediaName} className="h-full w-full object-contain" />
            )}
            {el.type === "video" && el.url && (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={el.url} className="h-full w-full object-contain" autoPlay muted loop playsInline />
            )}
            {el.type === "text" && (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  fontSize: el.fontSize,
                  fontWeight: el.fontWeight,
                  color: el.color,
                  textAlign: (el.textAlign as "left" | "center" | "right") ?? "left",
                  backgroundColor:
                    el.backgroundColor === "transparent" ? "transparent" : el.backgroundColor,
                  padding: "4px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflow: "hidden",
                }}
              >
                {el.text}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface TvPlayerProps {
  deviceId: string;
  deviceToken: string;
  deviceName: string;
  initialPlayback?: PlaybackStartPayload | null;
}

export default function TvPlayer({
  deviceId,
  deviceToken,
  deviceName,
  initialPlayback = null,
}: TvPlayerProps) {
  const [playback, setPlayback] = useState<PlaybackStartPayload | null>(initialPlayback);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [connected, setConnected] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const items: StreamPlaylistItem[] = playback?.items ?? [];
  const currentItem: StreamPlaylistItem | undefined = items[currentIndex];

  const goToNext = useCallback(() => {
    if (items.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [playback?.playlistId, playback?.startedAt]);

  // Image timer
  useEffect(() => {
    if (!currentItem || currentItem.type !== "image") return;
    if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    imageTimerRef.current = setTimeout(goToNext, IMAGE_DURATION_MS);
    return () => {
      if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    };
  }, [currentItem, goToNext]);

  // Content canvas timer
  useEffect(() => {
    if (!currentItem || currentItem.type !== "content") return;
    const dur = (currentItem as StreamContentItem).duration ?? 10;
    if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    imageTimerRef.current = setTimeout(goToNext, dur * 1000);
    return () => {
      if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    };
  }, [currentItem, goToNext]);

  // Socket connection
  useEffect(() => {
    const socket = connectDeviceSocket(deviceId, deviceToken);
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("playback:start", (payload: PlaybackStartPayload) => setPlayback(payload));
    socket.on("playback:stop", () => { setPlayback(null); setCurrentIndex(0); });
    const heartbeat = setInterval(() => { if (socket.connected) socket.emit("heartbeat"); }, 30000);
    return () => { clearInterval(heartbeat); socket.disconnect(); };
  }, [deviceId, deviceToken]);

  // Video autoplay on item change
  useEffect(() => {
    if (!currentItem || currentItem.type !== "video") return;
    const video = videoRef.current;
    if (!video) return;
    video.load();
    video.play().catch(() => {});
  }, [currentItem]);

  if (!playback || items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <p className="mb-2 text-sm uppercase tracking-widest text-white/50">
          {connected ? "Connected" : "Connecting..."}
        </p>
        <h1 className="text-3xl font-bold">{deviceName}</h1>
        <p className="mt-4 text-white/60">Waiting for content from dashboard...</p>
      </div>
    );
  }

  const isMedia = (item: StreamPlaylistItem): item is StreamMediaItem =>
    item.type === "image" || item.type === "video" || item.type === "document";

  return (
    <div className="relative min-h-screen bg-black">
      {/* Status overlay */}
      <div className="absolute left-4 top-4 z-10 rounded-lg bg-black/60 px-3 py-2 text-xs text-white/80">
        <p className="font-semibold">{deviceName}</p>
        <p>{playback.playlistName}</p>
        <p className={connected ? "text-green-400" : "text-yellow-400"}>
          {connected ? "Live" : "Reconnecting..."}
        </p>
      </div>

      {currentItem?.type === "content" ? (
        <ContentCanvas item={currentItem as StreamContentItem} />
      ) : currentItem?.type === "video" && isMedia(currentItem) ? (
        <video
          ref={videoRef}
          key={currentItem.id}
          src={currentItem.url}
          className="h-screen w-full object-contain"
          autoPlay
          muted
          playsInline
          onEnded={goToNext}
        />
      ) : currentItem?.type === "image" && isMedia(currentItem) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={currentItem.id}
          src={currentItem.url}
          alt={(currentItem as StreamMediaItem).name}
          className="h-screen w-full object-contain"
        />
      ) : (
        <div className="flex h-screen items-center justify-center text-white/70">
          Unsupported media type
        </div>
      )}
    </div>
  );
}
