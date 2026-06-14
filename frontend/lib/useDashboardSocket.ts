"use client";

import { useEffect, useRef } from "react";
import { connectDashboardSocket } from "./socket";
import type { LiveDeviceStats } from "./api";

export interface DeviceSocketEvent {
  deviceId: string;
  name?: string;
  status: "online" | "offline";
}

export interface PresentDeliveredEvent {
  deviceIds: string[];
  playlistId: string;
  playlistName: string;
  deliveredAt: string;
}

interface DashboardSocketHandlers {
  onLiveStats?: (stats: LiveDeviceStats) => void;
  onDeviceConnected?: (event: DeviceSocketEvent) => void;
  onDeviceDisconnected?: (event: DeviceSocketEvent) => void;
  onPresentDelivered?: (event: PresentDeliveredEvent) => void;
}

export function useDashboardSocket(handlers: DashboardSocketHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const socket = connectDashboardSocket();

    socket.on("live:stats", (stats: LiveDeviceStats) => {
      handlersRef.current.onLiveStats?.(stats);
    });
    socket.on("device:connected", (event: DeviceSocketEvent) => {
      handlersRef.current.onDeviceConnected?.(event);
    });
    socket.on("device:disconnected", (event: DeviceSocketEvent) => {
      handlersRef.current.onDeviceDisconnected?.(event);
    });
    socket.on("present:delivered", (event: PresentDeliveredEvent) => {
      handlersRef.current.onPresentDelivered?.(event);
    });

    return () => {
      socket.disconnect();
    };
  }, []);
}

export function patchDeviceStatus<T extends { id: string; status: "online" | "offline" }>(
  devices: T[],
  deviceId: string,
  status: "online" | "offline"
): T[] {
  return devices.map((device) =>
    device.id === deviceId ? { ...device, status } : device
  );
}
