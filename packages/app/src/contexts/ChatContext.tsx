import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useSession } from '../api/sessions';
import { ActiveUser, Message, ErrorEvent, BannedUser } from '../types';

// Custom hooks
import { useChatMessageLogic } from '../hooks/chat/useChatMessageLogic';
import { useChatSessionLogic } from '../hooks/chat/useChatSessionLogic';
import { useChatReadyCheck } from '../hooks/chat/useChatReadyCheck';
import { useChatModeration } from '../hooks/chat/useChatModeration';
import { useChatPreferences } from '../hooks/chat/useChatPreferences';

interface ChatContextType {
    activeUsers: ActiveUser[];
    messages: Message[];
    moderators: string[];
    isConnected: boolean;
    error: string | null;
    sendMessage: (content: string, phase?: string, productIndex?: number, tags?: string[]) => void;
    injectDebugHistory: () => void;
    deleteMessage: (messageId: string) => void;
    editMessage: (messageId: string, content: string) => void;
    makeModerator: (userId: string) => void;
    revealAllSpoilers: () => void;
    revealMySpoilers: () => void;
    sessionId: string | null;
    sessionEnded: boolean;
    sessionEndedBy: string | null;
    sessionEndedLive: boolean;
    hostId: string | null;
    revealedMessageIds: Set<string>;
    globallyRevealedMessageIds: Set<string>;
    updateRating: (rating: number, productIndex?: number) => void;
    updateValueGrade: (valueGrade: 'A' | 'B' | 'C' | 'D' | 'F', productIndex?: number) => void;
    averageRating: number | null;
    averageRatings: Record<number, number | null>;
    valueGradeDistributions: Record<number, Record<'A' | 'B' | 'C' | 'D' | 'F', number>>;
    phaseVisibility: Record<string, 'normal' | 'hidden' | 'revealed'>;
    setPhaseVisibility: (phase: string, visibility: 'normal' | 'hidden' | 'revealed') => void;
    setAllPhaseVisibility: (visibility: 'normal' | 'hidden' | 'revealed') => void;
    spoilerDefaults: Record<string, 'normal' | 'hidden' | 'revealed'>;
    setSpoilerDefault: (phase: string, visibility: 'normal' | 'hidden' | 'revealed') => void;
    livestreamUrl: string | null;
    customTags: string[];
    canModerate: boolean;
    currentUserId: string | null;
    recentTags: string[];
    isAnalyzing: boolean;
    summaryId: string | null;
    updateRecentTags: (tags: string[]) => Promise<void>;
    setLivestreamUrl: (url: string | null) => void;
    readyCheckActive: boolean;
    readyUsers: Set<string>;
    startReadyCheck: () => void;
    endReadyCheck: () => void;
    markReady: () => void;
    markUnready: () => void;
    isMuted: boolean;
    mutedUsers: BannedUser[];
    kickedUsers: BannedUser[];
    muteUser: (userId: string, eraseMessages?: boolean) => void;
    unmuteUser: (userId: string) => void;
    kickUser: (userId: string, eraseMessages?: boolean) => void;
    unkickUser: (userId: string) => void;
    getBannedUsers: () => void;
    unmodUser: (userId: string) => void;
    isSolo: boolean;
    sessionTags: string[];
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const socket = useSocket();
    const location = useLocation();
    const navigate = useNavigate();
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const match = location.pathname.match(/^\/session\/([^\/]+)$/);
    const sessionId = match ? match[1] : null;

    const { data: sessionData } = useSession(sessionId || '');
    const isSolo = sessionData?.session?.isSolo || false;

    // Initialize feature-specific hooks
    const {
        currentUserId,
        recentTags,
        phaseVisibility,
        spoilerDefaults,
        setSpoilerDefault,
        updateRecentTags,
        setPhaseVisibility,
        setAllPhaseVisibility,
    } = useChatPreferences(sessionId, isSolo);

    const {
        messages,
        setMessages,
        revealedMessageIds,
        setRevealedMessageIds,
        globallyRevealedMessageIds,
        setGloballyRevealedMessageIds,
        sendMessage,
        deleteMessage,
        editMessage,
        revealAllSpoilers,
        revealMySpoilers: revealMySpoilersBase,
    } = useChatMessageLogic(socket, sessionId, false); // sessionEnded will be updated below

    const {
        activeUsers,
        moderators,
        hostId,
        averageRating,
        livestreamUrl,
        customTags,
        sessionEnded,
        sessionEndedBy,
        sessionEndedLive,
        isAnalyzing,
        summaryId,
        updateRating,
        updateValueGrade,
        setHostId,
        setLivestreamUrl,
        setCustomTags,
        setSessionEnded,
        setSessionEndedBy,
        setSessionEndedLive: _setSessionEndedLive,
        setIsAnalyzing,
        setSummaryId,
        setActiveUsers,
        setModerators,
        setAverageRating,
        averageRatings,
        valueGradeDistributions,
    } = useChatSessionLogic(socket, sessionId, setMessages);

    const {
        readyCheckActive,
        readyUsers,
        startReadyCheck,
        endReadyCheck,
        markReady,
        markUnready,
        setReadyCheckActive,
        setReadyUsers,
    } = useChatReadyCheck(socket, sessionId);

    const {
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
    } = useChatModeration(socket, sessionId, navigate, setMessages);

    // Personal reveal wrapper that also updates phase visibility
    const revealMySpoilers = useCallback(() => {
        revealMySpoilersBase();
        setAllPhaseVisibility('revealed');
    }, [revealMySpoilersBase, setAllPhaseVisibility]);

    // Handle session join/leave and error events
    useEffect(() => {
        if (!socket || !sessionId) {
            // Reset all state when leaving session
            setActiveUsers([]);
            setMessages([]);
            setModerators([]);
            setIsConnected(false);
            setSessionEnded(false);
            setSessionEndedBy(null);
            setHostId(null);
            setRevealedMessageIds(new Set());
            setGloballyRevealedMessageIds(new Set());
            setAverageRating(null);
            setLivestreamUrl(null);
            setCustomTags([]);
            setIsAnalyzing(false);
            setSummaryId(null);
            setReadyCheckActive(false);
            setReadyUsers(new Set());
            setIsMuted(false);
            setMutedUsers([]);
            setKickedUsers([]);
            return;
        }

        console.log('Joining session:', sessionId);
        socket.emit('join_session', { sessionId });
        setIsConnected(true);

        const handleError = (data: ErrorEvent & { code?: string; remainingSeconds?: number }) => {
            if (data.code === 'RATE_LIMIT_EXCEEDED' && data.remainingSeconds) {
                const endTime = Date.now() + (data.remainingSeconds * 1000);
                setError(`Rate limit exceeded. Try again in ${data.remainingSeconds}s`);

                const interval = setInterval(() => {
                    const remaining = Math.ceil((endTime - Date.now()) / 1000);
                    if (remaining <= 0) {
                        clearInterval(interval);
                        setError(null);
                    } else {
                        setError(`Rate limit exceeded. Try again in ${remaining}s`);
                    }
                }, 1000);
            } else {
                setError(data.message);
            }
            console.error('Socket error:', data.message);
        };

        socket.on('error', handleError);

        return () => {
            console.log('Leaving session:', sessionId);
            socket.emit('leave_session', { sessionId });
            socket.off('error', handleError);
            setIsConnected(false);
        };
    }, [socket, sessionId]);

    const injectDebugHistory = useCallback(() => {
        if (socket && sessionId && !sessionEnded) {
            socket.emit('inject_debug_history', { sessionId });
        }
    }, [socket, sessionId, sessionEnded]);

    const makeModerator = useCallback((userId: string) => {
        if (socket && sessionId) {
            socket.emit('make_moderator', {
                sessionId,
                userId,
            });
        }
    }, [socket, sessionId]);

    return (
        <ChatContext.Provider value={{
            activeUsers,
            messages,
            moderators,
            isConnected,
            error,
            sendMessage,
            injectDebugHistory,
            deleteMessage,
            editMessage,
            makeModerator,
            revealAllSpoilers,
            revealMySpoilers,
            sessionId,
            sessionEnded,
            sessionEndedBy,
            sessionEndedLive,
            hostId,
            revealedMessageIds,
            globallyRevealedMessageIds,
            updateRating,
            updateValueGrade,
            averageRating,
            averageRatings,
            valueGradeDistributions,
            phaseVisibility,
            setPhaseVisibility,
            setAllPhaseVisibility,
            spoilerDefaults,
            setSpoilerDefault,
            livestreamUrl,
            customTags,
            canModerate: hostId === currentUserId || moderators.includes(currentUserId || ''),
            currentUserId,
            recentTags,
            isAnalyzing,
            summaryId,
            updateRecentTags,
            setLivestreamUrl,
            readyCheckActive,
            readyUsers,
            startReadyCheck,
            endReadyCheck,
            markReady,
            markUnready,
            isMuted,
            mutedUsers,
            kickedUsers,
            muteUser,
            unmuteUser,
            kickUser,
            unkickUser,
            getBannedUsers,
            unmodUser,
            isSolo,
            sessionTags: Array.from(new Set(messages.flatMap(m => m.tags || []))).sort(),
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
};
