/**
 * Keep-Alive Service for Render Free Tier
 *
 * Render spins down free web services after 15 minutes of inactivity.
 * This service automatically sends a periodic ping to keep the backend alive
 * when running on Render or any environment with a public URL configured.
 */

let keepAliveTimer = null;

export const initKeepAlive = () => {
    // Check if keep-alive is explicitly disabled
    if (process.env.ENABLE_KEEP_ALIVE === 'false') {
        console.log('[KeepAlive] Disabled via ENABLE_KEEP_ALIVE=false');
        return;
    }

    // Auto-detect Render external URL or user-defined URL
    const targetBaseUrl =
        process.env.RENDER_EXTERNAL_URL ||
        process.env.KEEP_ALIVE_URL ||
        process.env.BACKEND_URL ||
        process.env.SERVER_URL;

    if (!targetBaseUrl) {
        if (process.env.NODE_ENV === 'production') {
            console.warn(
                '[KeepAlive] No RENDER_EXTERNAL_URL or KEEP_ALIVE_URL found. ' +
                'Set KEEP_ALIVE_URL in your environment variables to enable self-pinging.'
            );
        }
        return;
    }

    // Clean URL and formulate ping endpoint
    const baseUrl = targetBaseUrl.replace(/\/$/, '');
    const pingUrl = `${baseUrl}/api/health/ping`;

    // Render sleeps at 15 mins. Default ping interval is 12 minutes (720,000 ms)
    const intervalMinutes = Number(process.env.KEEP_ALIVE_INTERVAL_MINUTES) || 12;
    const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;

    console.log(`[KeepAlive] Scheduled self-ping every ${intervalMinutes}m to: ${pingUrl}`);

    const pingServer = async () => {
        try {
            const startTime = Date.now();
            const response = await fetch(pingUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'StayHub-KeepAlive-Bot/1.0',
                },
                // 15 seconds timeout
                signal: AbortSignal.timeout(15000),
            });

            const duration = Date.now() - startTime;
            if (response.ok) {
                console.log(`[KeepAlive] Ping successful (${response.status}) in ${duration}ms at ${new Date().toLocaleTimeString()}`);
            } else {
                console.warn(`[KeepAlive] Ping responded with status ${response.status} at ${new Date().toLocaleTimeString()}`);
            }
        } catch (error) {
            console.warn(`[KeepAlive] Ping attempt failed: ${error.message}`);
        }
    };

    // Initial ping after 30 seconds to confirm connectivity
    const initialTimeout = setTimeout(() => {
        pingServer();
    }, 30 * 1000);

    // Periodic ping loop
    keepAliveTimer = setInterval(pingServer, intervalMs);

    // Unref timer so it doesn't block graceful process exit
    if (keepAliveTimer?.unref) {
        keepAliveTimer.unref();
    }
    if (initialTimeout?.unref) {
        initialTimeout.unref();
    }
};

export const stopKeepAlive = () => {
    if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
        console.log('[KeepAlive] Stopped.');
    }
};
