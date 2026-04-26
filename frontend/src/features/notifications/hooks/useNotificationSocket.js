// features/notifications/hooks/useNotificationSocket.js
import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { API_GATEWAY_URL } from '../../../constants.jsx';
import { apiSlice } from '../../../api/apiSlice.js';

/**
 * Hook to establish a real-time WebSocket connection for instant notification alerts
 */
export const useNotificationSocket = () => {
    const dispatch = useDispatch();
    const { currentUser } = useSelector((state) => state.app);
    const [liveNotification, setLiveNotification] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        const userId = currentUser?._id || currentUser?.id || localStorage.getItem('userId');

        if (!userId) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }

        // Initialize Socket.io client
        const socket = io(API_GATEWAY_URL, {
            withCredentials: true,
            query: { userId },
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Notification socket connected:', socket.id);
            socket.emit('register_user', userId);
        });

        // Listen for new real-time notification
        socket.on('new_notification', (notification) => {
            console.log('Received real-time notification:', notification);
            // Invalidate RTK Query cache to trigger refetch of notifications & unread count
            dispatch(apiSlice.util.invalidateTags(['Notifications']));

            // Set live notification toast popup
            setLiveNotification(notification);
        });

        // Listen for unread count updates
        socket.on('unread_count_update', ({ count }) => {
            dispatch(apiSlice.util.invalidateTags(['Notifications']));
        });

        socket.on('disconnect', (reason) => {
            console.log('Notification socket disconnected:', reason);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [currentUser, dispatch]);

    const clearLiveNotification = () => {
        setLiveNotification(null);
    };

    return { liveNotification, clearLiveNotification };
};

export default useNotificationSocket;
