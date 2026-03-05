/**
 * lib/socket-io.ts
 * Singleton Socket.IO server accessor.
 * The server is created in server.ts and stored on the global object so every
 * Next.js API route can emit events without importing the heavy Server class.
 */

import type { Server } from 'socket.io';

export function getIO(): Server | null {
    return (global as any).__socket_io ?? null;
}

/**
 * Emit a Socket.IO event to a specific user (room: `user:<userId>`).
 */
export function emitToUser(userId: string, event: string, data: unknown) {
    const io = getIO();
    if (!io) {
        console.warn('[Socket.IO] Server not initialized — cannot emit to user', userId);
        return;
    }
    io.to(`user:${userId}`).emit(event, data);
}

/**
 * Broadcast to all connected clients.
 */
export function broadcast(event: string, data: unknown) {
    const io = getIO();
    io?.emit(event, data);
}
