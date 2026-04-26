// config/socket.js
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;

export const initSocket = (httpServer, allowedOrigins = []) => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: function (origin, callback) {
                if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
                    callback(null, true);
                } else {
                    callback(null, true); // Permissive for local dev & websockets
                }
            },
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Socket authentication middleware
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;

            if (userId) {
                socket.userId = userId;
                return next();
            }

            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                socket.userId = decoded.id;
                return next();
            }

            // Allow connection even if unauthenticated (e.g. guest viewing public stream)
            next();
        } catch (err) {
            console.warn('Socket authentication warning:', err.message);
            next();
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.userId;
        if (userId) {
            const userRoom = `user:${userId}`;
            socket.join(userRoom);
            console.log(`Socket client connected: ${socket.id} joined room ${userRoom}`);
        } else {
            console.log(`Socket client connected anonymously: ${socket.id}`);
        }

        // Allow clients to explicitly register their user ID
        socket.on('register_user', (regUserId) => {
            if (regUserId) {
                socket.userId = regUserId;
                const room = `user:${regUserId}`;
                socket.join(room);
                console.log(`Socket ${socket.id} registered and joined ${room}`);
            }
        });

        socket.on('disconnect', (reason) => {
            console.log(`Socket client disconnected: ${socket.id} (reason: ${reason})`);
        });
    });

    return io;
};

export const getIO = () => {
    return io;
};

export const emitToUser = (userId, event, payload) => {
    if (!io) {
        return false;
    }
    const userRoom = `user:${userId}`;
    io.to(userRoom).emit(event, payload);
    return true;
};
