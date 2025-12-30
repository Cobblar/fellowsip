import { useState, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { NavigateFunction } from 'react-router-dom';
import { BannedUser, YouWereMutedEvent, YouWereUnmutedEvent, YouWereKickedEvent, BannedUsersListEvent, UserMutedEvent, UserUnmutedEvent, MessagesErasedEvent, Message } from '../../types';

export const useChatModeration = (socket: Socket | null, sessionId: string | null, navigate: NavigateFunction, setMessages: React.Dispatch<React.SetStateAction<Message[]>>) => {
    const [isMuted, setIsMuted] = useState(false);
    const [mutedUsers, setMutedUsers] = useState<BannedUser[]>([]);
    const [kickedUsers, setKickedUsers] = useState<BannedUser[]>([]);

    const muteUser = useCallback((targetUserId: string, eraseMessages?: boolean) => {
        if (socket && sessionId) {
            socket.emit('mute_user', { sessionId, userId: targetUserId, eraseMessages });
        }
    }, [socket, sessionId]);

    const unmuteUser = useCallback((targetUserId: string) => {
        if (socket && sessionId) {
            socket.emit('unmute_user', { sessionId, userId: targetUserId });
        }
    }, [socket, sessionId]);

    const kickUser = useCallback((targetUserId: string, eraseMessages?: boolean) => {
        if (socket && sessionId) {
            socket.emit('kick_user', { sessionId, userId: targetUserId, eraseMessages });
        }
    }, [socket, sessionId]);

    const unkickUser = useCallback((targetUserId: string) => {
        if (socket && sessionId) {
            socket.emit('unkick_user', { sessionId, userId: targetUserId });
        }
    }, [socket, sessionId]);

    const getBannedUsers = useCallback(() => {
        if (socket && sessionId) {
            socket.emit('get_banned_users', { sessionId });
        }
    }, [socket, sessionId]);

    const unmodUser = useCallback((userId: string) => {
        if (socket && sessionId) {
            socket.emit('unmod_user', { sessionId, userId });
        }
    }, [socket, sessionId]);

    useEffect(() => {
        if (!socket) return;

        const handleYouWereMuted = (_data: YouWereMutedEvent) => {
            setIsMuted(true);
        };

        const handleYouWereUnmuted = (_data: YouWereUnmutedEvent) => {
            setIsMuted(false);
        };

        const handleYouWereKicked = (data: YouWereKickedEvent) => {
            navigate('/', { state: { kickedMessage: data.message } });
        };

        const handleBannedUsersList = (data: BannedUsersListEvent) => {
            setMutedUsers(data.mutedUsers);
            setKickedUsers(data.kickedUsers);
        };

        const handleUserMuted = (data: UserMutedEvent) => {
            setMutedUsers((prev) => {
                if (prev.some(u => u.id === data.userId)) return prev;
                return [...prev, { id: data.userId, displayName: data.displayName }];
            });
        };

        const handleUserUnmuted = (data: UserUnmutedEvent) => {
            setMutedUsers((prev) => prev.filter(u => u.id !== data.userId));
        };

        const handleMessagesErased = (data: MessagesErasedEvent) => {
            setMessages((prev) => prev.filter(m => !data.messageIds.includes(m.id)));
        };

        socket.on('you_were_muted', handleYouWereMuted);
        socket.on('you_were_unmuted', handleYouWereUnmuted);
        socket.on('you_were_kicked', handleYouWereKicked);
        socket.on('banned_users_list', handleBannedUsersList);
        socket.on('user_muted', handleUserMuted);
        socket.on('user_unmuted', handleUserUnmuted);
        socket.on('messages_erased', handleMessagesErased);

        return () => {
            socket.off('you_were_muted', handleYouWereMuted);
            socket.off('you_were_unmuted', handleYouWereUnmuted);
            socket.off('you_were_kicked', handleYouWereKicked);
            socket.off('banned_users_list', handleBannedUsersList);
            socket.off('user_muted', handleUserMuted);
            socket.off('user_unmuted', handleUserUnmuted);
            socket.off('messages_erased', handleMessagesErased);
        };
    }, [socket, navigate, setMessages]);

    return {
        isMuted,
        mutedUsers,
        kickedUsers,
        muteUser,
        unmuteUser,
        kickUser,
        unkickUser,
        getBannedUsers,
        unmodUser,
        setIsMuted,
        setMutedUsers,
        setKickedUsers,
    };
};
