import mongoose from 'mongoose';

const formatUptime = (seconds) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
};

const getDbStateName = (state) => {
    switch (state) {
        case 0: return 'disconnected';
        case 1: return 'connected';
        case 2: return 'connecting';
        case 3: return 'disconnecting';
        default: return 'unknown';
    }
};

/**
 * @desc Comprehensive server health status
 * @route GET /api/health or GET /health
 */
export const getHealthStatus = (req, res) => {
    const uptimeSeconds = process.uptime();
    const memory = process.memoryUsage();
    const dbState = mongoose.connection.readyState;
    const isDbConnected = dbState === 1;

    res.status(200).json({
        status: isDbConnected ? 'healthy' : 'degraded',
        message: 'StayHub API is active and running',
        timestamp: new Date().toISOString(),
        uptime: {
            seconds: Math.floor(uptimeSeconds),
            formatted: formatUptime(uptimeSeconds),
        },
        environment: process.env.NODE_ENV || 'development',
        database: {
            status: getDbStateName(dbState),
            connected: isDbConnected,
        },
        system: {
            nodeVersion: process.version,
            memoryMB: {
                rss: (memory.rss / (1024 * 1024)).toFixed(2),
                heapUsed: (memory.heapUsed / (1024 * 1024)).toFixed(2),
                heapTotal: (memory.heapTotal / (1024 * 1024)).toFixed(2),
            },
        },
    });
};

/**
 * @desc Lightweight ping endpoint for uptime monitors and keep-alive pingers
 * @route GET /api/health/ping or GET /health/ping
 */
export const getPing = (req, res) => {
    res.status(200).json({
        status: 'ok',
        pong: true,
        timestamp: new Date().toISOString(),
    });
};
