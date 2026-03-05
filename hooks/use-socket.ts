"use client";

/**
 * hooks/use-socket.ts
 * Manages a single Socket.IO client connection for the current user session.
 * Returns { socket, isConnected }.
 */

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';

let socketSingleton: Socket | null = null;

export function useSocket() {
    const { data: session } = useSession() as any;
    const userId = session?.user?.id;
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!userId) return;

        // Reuse existing singleton
        if (!socketSingleton) {
            socketSingleton = io({
                path: '/api/socket',
                transports: ['websocket', 'polling'],
                reconnectionAttempts: 5,
                reconnectionDelay: 2000,
            });
        }

        socketRef.current = socketSingleton;
        const socket = socketRef.current;

        const onConnect = () => {
            setIsConnected(true);
            // Register user room immediately after (re)connecting
            socket.emit('user:register', { userId });
        };
        const onDisconnect = () => setIsConnected(false);

        if (socket.connected) {
            setIsConnected(true);
            socket.emit('user:register', { userId });
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, [userId]);

    return { socket: socketRef.current, isConnected };
}
