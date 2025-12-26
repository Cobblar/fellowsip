import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './useSocket';
import { notificationKeys } from '../api/notifications';
import { friendKeys } from '../api/friends';

/**
 * Global socket event listener that invalidates React Query caches
 * when real-time events arrive. Use this component once at app root level.
 */
export function useSocketEvents() {
    const socket = useSocket();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket) return;

        // Listen for new notifications
        const handleNewNotification = () => {
            console.log('Real-time: New notification received');
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        };

        // Listen for join request received (host sees someone requesting)
        const handleJoinRequestReceived = (data: { sessionId: string }) => {
            console.log('Real-time: Join request received for session', data.sessionId);
            queryClient.invalidateQueries({ queryKey: friendKeys.joinRequests(data.sessionId) });
        };

        // Listen for join request updated (requester sees their status change)
        const handleJoinRequestUpdated = () => {
            console.log('Real-time: Join request status updated');
            queryClient.invalidateQueries({ queryKey: friendKeys.myJoinRequests() });
        };

        // Listen for friend starting a new session
        const handleFriendSessionStarted = () => {
            console.log('Real-time: Friend started a new session');
            queryClient.invalidateQueries({ queryKey: friendKeys.sessions() });
        };

        // Listen for friend ending a session
        const handleFriendSessionEnded = () => {
            console.log('Real-time: Friend ended a session');
            queryClient.invalidateQueries({ queryKey: friendKeys.sessions() });
        };

        socket.on('new_notification', handleNewNotification);
        socket.on('join_request_received', handleJoinRequestReceived);
        socket.on('join_request_updated', handleJoinRequestUpdated);
        socket.on('friend_session_started', handleFriendSessionStarted);
        socket.on('friend_session_ended', handleFriendSessionEnded);

        return () => {
            socket.off('new_notification', handleNewNotification);
            socket.off('join_request_received', handleJoinRequestReceived);
            socket.off('join_request_updated', handleJoinRequestUpdated);
            socket.off('friend_session_started', handleFriendSessionStarted);
            socket.off('friend_session_ended', handleFriendSessionEnded);
        };
    }, [socket, queryClient]);
}

