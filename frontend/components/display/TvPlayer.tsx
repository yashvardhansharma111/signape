"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  connectDeviceSocket,
  type PlaybackStartPayload,
  type StreamMediaItem,
} from "@/lib/socket";

const IMAGE_DURATION_MS = 8000;

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

  const items = playback?.items ?? [];
  const currentItem: StreamMediaItem | undefined = items[currentIndex];

  const goToNext = useCallback(() => {
    if (items.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [playback?.playlistId, playback?.startedAt]);

  useEffect(() => {
    if (!currentItem || currentItem.type !== "image") return;

    if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    imageTimerRef.current = setTimeout(goToNext, IMAGE_DURATION_MS);

    return () => {
      if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    };
  }, [currentItem, goToNext]);

  useEffect(() => {
    const socket = connectDeviceSocket(deviceId, deviceToken);

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("playback:start", (payload: PlaybackStartPayload) => {
      setPlayback(payload);
    });

    socket.on("playback:stop", () => {
      setPlayback(null);
      setCurrentIndex(0);
    });

    const heartbeat = setInterval(() => {
      if (socket.connected) socket.emit("heartbeat");
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      socket.disconnect();
    };
  }, [deviceId, deviceToken]);

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

  return (
    <div className="relative min-h-screen bg-black">
      <div className="absolute left-4 top-4 z-10 rounded-lg bg-black/60 px-3 py-2 text-xs text-white/80">
        <p className="font-semibold">{deviceName}</p>
        <p>{playback.playlistName}</p>
        <p className={connected ? "text-green-400" : "text-yellow-400"}>
          {connected ? "Live" : "Reconnecting..."}
        </p>
      </div>

      {currentItem?.type === "video" ? (
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
      ) : currentItem?.type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={currentItem.id}
          src={currentItem.url}
          alt={currentItem.name}
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
