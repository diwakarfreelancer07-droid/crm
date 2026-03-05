/**
 * server.ts
 * Custom Next.js server that attaches Socket.IO for real-time call notifications.
 *
 * Start with:  npx ts-node --skip-project server.ts      (dev)
 * Production:  npx ts-node --skip-project server.ts      (or compile first)
 *
 * Update package.json scripts:
 *   "dev":   "ts-node --skip-project server.ts"
 *   "start": "NODE_ENV=production ts-node --skip-project server.ts"
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url!, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    // ── Socket.IO ────────────────────────────────────────────────────────────
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.NEXT_PUBLIC_APP_URL || '*',
            methods: ['GET', 'POST'],
        },
        transports: ['websocket', 'polling'],
        path: '/api/socket',
    });

    // Store on global so Next.js API routes can access it via lib/socket-io.ts
    (global as any).__socket_io = io;

    io.on('connection', (socket) => {
        console.log('[Socket.IO] Client connected:', socket.id);

        // Client must register their userId immediately after connecting
        socket.on('user:register', (data: { userId: string }) => {
            if (data?.userId) {
                socket.join(`user:${data.userId}`);
                console.log(`[Socket.IO] User ${data.userId} joined room user:${data.userId}`);
                socket.emit('user:registered', { success: true });
            }
        });

        socket.on('ping', () => {
            socket.emit('pong', { ts: Date.now() });
        });

        socket.on('disconnect', () => {
            console.log('[Socket.IO] Client disconnected:', socket.id);
        });
    });
    // ── ─────────────────────────────────────────────────────────────────────

    httpServer.once('error', (err) => {
        console.error(err);
        process.exit(1);
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> Socket.IO listening on /api/socket`);
    });
});
