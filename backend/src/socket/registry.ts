import type { Server } from "socket.io";

let io: Server | null = null;

export function setIo(server: Server) {
  io = server;
}

export function getIo() {
  return io;
}

export function getConnectedDeviceIds(): string[] {
  const socketServer = getIo();
  if (!socketServer) return [];

  const ids: string[] = [];
  for (const [roomName] of socketServer.sockets.adapter.rooms) {
    if (roomName.startsWith("device:")) {
      ids.push(roomName.slice("device:".length));
    }
  }
  return ids;
}
