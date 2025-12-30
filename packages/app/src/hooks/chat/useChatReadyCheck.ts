import { useState, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { ReadyCheckStartedEvent, ReadyCheckEndedEvent, UserReadyEvent, ReadyCheckStateEvent } from '../../types';

export const useChatReadyCheck = (socket: Socket | null, sessionId: string | null) => {
    const [readyCheckActive, setReadyCheckActive] = useState(false);
    const [readyUsers, setReadyUsers] = useState<Set<string>>(new Set());

    const startReadyCheck = useCallback(() => {
        if (socket && sessionId) {
            socket.emit('start_ready_check', { sessionId });
        }
    }, [socket, sessionId]);

    const endReadyCheck = useCallback(() => {
        if (socket && sessionId) {
            socket.emit('end_ready_check', { sessionId });
        }
    }, [socket, sessionId]);

    const markReady = useCallback(() => {
        if (socket && sessionId) {
            socket.emit('mark_ready', { sessionId });
        }
    }, [socket, sessionId]);

    const markUnready = useCallback(() => {
        if (socket && sessionId) {
            socket.emit('mark_unready', { sessionId });
        }
    }, [socket, sessionId]);

    useEffect(() => {
        if (!socket) return;

        const handleReadyCheckStarted = (_data: ReadyCheckStartedEvent) => {
            setReadyCheckActive(true);
            setReadyUsers(new Set());
        };

        const handleReadyCheckEnded = (_data: ReadyCheckEndedEvent) => {
            setReadyCheckActive(false);
            setReadyUsers(new Set());
        };

        const handleUserReady = (data: UserReadyEvent) => {
            setReadyUsers((prev) => new Set([...prev, data.userId]));
        };

        const handleReadyCheckState = (data: ReadyCheckStateEvent) => {
            setReadyCheckActive(data.isActive);
            setReadyUsers(new Set(data.readyUsers));
        };

        socket.on('ready_check_started', handleReadyCheckStarted);
        socket.on('ready_check_ended', handleReadyCheckEnded);
        socket.on('user_ready', handleUserReady);
        socket.on('ready_check_state', handleReadyCheckState);

        return () => {
            socket.off('ready_check_started', handleReadyCheckStarted);
            socket.off('ready_check_ended', handleReadyCheckEnded);
            socket.off('user_ready', handleUserReady);
            socket.off('ready_check_state', handleReadyCheckState);
        };
    }, [socket]);

    return {
        readyCheckActive,
        readyUsers,
        startReadyCheck,
        endReadyCheck,
        markReady,
        markUnready,
        setReadyCheckActive,
        setReadyUsers,
    };
};
