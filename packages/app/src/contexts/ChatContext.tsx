import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { api } from '../api/client';
import { ActiveUser, Message, MessageHistoryEvent, ActiveUsersEvent, NewMessageEvent, ErrorEvent, MessageDeletedEvent, MessageUpdatedEvent, SpoilersRevealedEvent, RatingUpdatedEvent } from '../types';

interface ChatContextType {
    activeUsers: ActiveUser[];
    messages: Message[];
    moderators: string[];
    isConnected: boolean;
    error: string | null;
    sendMessage: (content: string, phase?: string) => void;
    injectDebugHistory: () => void;
    deleteMessage: (messageId: string) => void;
    editMessage: (messageId: string, content: string) => void;
    makeModerator: (userId: string) => void;
    revealAllSpoilers: () => void; // Host only - reveals for everyone
    revealMySpoilers: () => void;  // Personal reveal for any user
    sessionId: string | null;
    sessionEnded: boolean;
    sessionEndedBy: string | null;
    hostId: string | null;
    revealedMessageIds: Set<string>; // Personal reveals
    globallyRevealedMessageIds: Set<string>; // Host reveals for everyone
    updateRating: (rating: number) => void;
    averageRating: number | null;
    phaseVisibility: Record<string, 'normal' | 'hidden' | 'revealed'>;
    setPhaseVisibility: (phase: string, visibility: 'normal' | 'hidden' | 'revealed') => void;
    setAllPhaseVisibility: (visibility: 'normal' | 'hidden' | 'revealed') => void;
    livestreamUrl: string | null;
    customTags: string[];
    canModerate: boolean;
    currentUserId: string | null;
    recentTags: string[];
    isAnalyzing: boolean;
    summaryId: string | null;
    updateRecentTags: (tags: string[]) => Promise<void>;
    setLivestreamUrl: (url: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const socket = useSocket();
    const location = useLocation();
    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [moderators, setModerators] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionEnded, setSessionEnded] = useState(false);
    const [sessionEndedBy, setSessionEndedBy] = useState<string | null>(null);
    const [hostId, setHostId] = useState<string | null>(null);
    const [revealedMessageIds, setRevealedMessageIds] = useState<Set<string>>(new Set());
    const [globallyRevealedMessageIds, setGloballyRevealedMessageIds] = useState<Set<string>>(new Set());
    const [averageRating, setAverageRating] = useState<number | null>(null);
    const [phaseVisibility, setPhaseVisibilityState] = useState<Record<string, 'normal' | 'hidden' | 'revealed'>>({
        nose: 'normal',
        palate: 'normal',
        finish: 'normal',
        texture: 'normal',
        untagged: 'normal',
    });
    const [livestreamUrl, setLivestreamUrl] = useState<string | null>(null);
    const [customTags, setCustomTags] = useState<string[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [recentTags, setRecentTags] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [summaryId, setSummaryId] = useState<string | null>(null);

    const match = location.pathname.match(/^\/session\/([^\/]+)$/);
    const sessionId = match ? match[1] : null;

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get<{
                    user: {
                        id: string;
                        preferences: { recentTags?: string[] } | null;
                    }
                }>('/auth/session');
                setCurrentUserId(response.user.id);
                setRecentTags(response.user.preferences?.recentTags || []);
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        };
        fetchUser();
    }, []);

    const updateRecentTags = async (tags: string[]) => {
        try {
            // Keep only last 10 unique tags
            const uniqueTags = Array.from(new Set(tags)).slice(-10);
            await api.patch('/auth/preferences', {
                preferences: { recentTags: uniqueTags }
            });
            setRecentTags(uniqueTags);
        } catch (error) {
            console.error('Failed to update recent tags:', error);
        }
    };

    useEffect(() => {
        if (!socket || !sessionId) {
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
            return;
        }

        console.log('Joining session:', sessionId);
        socket.emit('join_session', { sessionId });
        setIsConnected(true);

        const handleMessageHistory = (data: MessageHistoryEvent) => {
            setMessages(data.messages);
            if (data.livestreamUrl !== undefined) {
                setLivestreamUrl(data.livestreamUrl);
            }
            if (data.customTags !== undefined) {
                setCustomTags(data.customTags);
            }
            if (data.hostId !== undefined) {
                setHostId(data.hostId || null);
            }
        };

        const handleActiveUsers = (data: ActiveUsersEvent) => {
            setActiveUsers(data.users);
            setModerators(data.moderators || []);
        };

        const handleNewMessage = (message: NewMessageEvent) => {
            console.log('[DEBUG] handleNewMessage received:', message);
            setMessages((prev) => [...prev, message]);
        };

        const handleError = (data: ErrorEvent) => {
            setError(data.message);
            console.error('Socket error:', data.message);
        };

        const handleSessionEnded = (data: { sessionId: string; hostName: string; message: string; shouldAnalyze?: boolean }) => {
            setSessionEnded(true);
            setSessionEndedBy(data.hostName);
            if (data.shouldAnalyze) {
                setIsAnalyzing(true);
            }
            // Add a system message to the chat
            setMessages((prev) => [
                ...prev,
                {
                    id: `system-${Date.now()}`,
                    sessionId: data.sessionId,
                    userId: 'system',
                    content: data.message,
                    createdAt: new Date().toISOString(),
                    user: {
                        id: 'system',
                        displayName: 'System',
                        avatarUrl: null,
                    },
                },
            ]);
        };

        const handleSummaryGenerated = (data: { sessionId: string; summaryId: string }) => {
            console.log('Summary generated:', data);
            setIsAnalyzing(false);
            setSummaryId(data.summaryId);
        };

        const handleHostTransferred = (data: { sessionId: string; newHostId: string; newHostName: string; message: string }) => {
            console.log('Host transferred:', data);
            setHostId(data.newHostId);
            // Add a system message to the chat
            setMessages((prev) => [
                ...prev,
                {
                    id: `system-${Date.now()}`,
                    sessionId: data.sessionId,
                    userId: 'system',
                    content: data.message,
                    createdAt: new Date().toISOString(),
                    user: {
                        id: 'system',
                        displayName: 'System',
                        avatarUrl: null,
                    },
                },
            ]);
        };

        const handleMessageDeleted = (data: MessageDeletedEvent) => {
            console.log('Message deleted:', data);
            setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
        };

        const handleMessageUpdated = (data: MessageUpdatedEvent) => {
            console.log('Message updated:', data);
            setMessages((prev) => prev.map((m) =>
                m.id === data.messageId ? { ...m, content: data.content } : m
            ));
        };

        const handleSpoilersRevealed = (data: SpoilersRevealedEvent) => {
            console.log('Spoilers revealed:', data);
            if (data.isGlobal) {
                // Host revealed for everyone
                setGloballyRevealedMessageIds((prev) => {
                    const newSet = new Set(prev);
                    data.messageIds.forEach((id) => newSet.add(id));
                    return newSet;
                });
            } else {
                // Personal reveal
                setRevealedMessageIds((prev) => {
                    const newSet = new Set(prev);
                    data.messageIds.forEach((id) => newSet.add(id));
                    return newSet;
                });
            }
        };

        const handleRatingUpdated = (data: RatingUpdatedEvent) => {
            console.log('Rating updated:', data);
            setActiveUsers((prev) => prev.map(user =>
                user.userId === data.userId ? { ...user, rating: data.rating } : user
            ));
            setAverageRating(data.averageRating);
        };

        const handleLivestreamUpdated = (data: { sessionId: string; url: string | null }) => {
            console.log('Livestream updated:', data);
            setLivestreamUrl(data.url);
        };

        const handleCustomTagsUpdated = (data: { sessionId: string; tags: string[] }) => {
            console.log('Custom tags updated:', data);
            setCustomTags(data.tags);
        };

        socket.on('message_history', handleMessageHistory);
        socket.on('active_users', handleActiveUsers);
        socket.on('new_message', handleNewMessage);
        socket.on('error', handleError);
        socket.on('session_ended', handleSessionEnded);
        socket.on('summary_generated', handleSummaryGenerated);
        socket.on('host_transferred', handleHostTransferred);
        socket.on('message_deleted', handleMessageDeleted);
        socket.on('message_updated', handleMessageUpdated);
        socket.on('spoilers_revealed', handleSpoilersRevealed);
        socket.on('rating_updated', handleRatingUpdated);
        socket.on('livestream_updated', handleLivestreamUpdated);
        socket.on('custom_tags_updated', handleCustomTagsUpdated);

        return () => {
            console.log('Leaving session:', sessionId);
            socket.emit('leave_session', { sessionId });
            socket.off('message_history', handleMessageHistory);
            socket.off('active_users', handleActiveUsers);
            socket.off('new_message', handleNewMessage);
            socket.off('error', handleError);
            socket.off('session_ended', handleSessionEnded);
            socket.off('summary_generated', handleSummaryGenerated);
            socket.off('host_transferred', handleHostTransferred);
            socket.off('message_deleted', handleMessageDeleted);
            socket.off('message_updated', handleMessageUpdated);
            socket.off('spoilers_revealed', handleSpoilersRevealed);
            socket.off('rating_updated', handleRatingUpdated);
            socket.off('livestream_updated', handleLivestreamUpdated);
            socket.off('custom_tags_updated', handleCustomTagsUpdated);
            setIsConnected(false);
            setSessionEnded(false);
            setSessionEndedBy(null);
        };
    }, [socket, sessionId]);

    const sendMessage = useCallback((content: string, phase?: string) => {
        if (socket && sessionId && content.trim() && !sessionEnded) {
            socket.emit('send_message', {
                sessionId,
                content: content.trim(),
                phase,
            });
        }
    }, [socket, sessionId, sessionEnded]);

    const injectDebugHistory = useCallback(() => {
        if (socket && sessionId && !sessionEnded) {
            socket.emit('inject_debug_history', { sessionId });
        }
    }, [socket, sessionId, sessionEnded]);

    const deleteMessage = useCallback((messageId: string) => {
        if (socket && sessionId) {
            socket.emit('delete_message', {
                sessionId,
                messageId,
            });
        }
    }, [socket, sessionId]);

    const editMessage = useCallback((messageId: string, content: string) => {
        if (socket && sessionId && content.trim()) {
            socket.emit('edit_message', {
                sessionId,
                messageId,
                content: content.trim(),
            });
        }
    }, [socket, sessionId]);

    const makeModerator = useCallback((userId: string) => {
        if (socket && sessionId) {
            socket.emit('make_moderator', {
                sessionId,
                userId,
            });
        }
    }, [socket, sessionId]);

    const revealAllSpoilers = useCallback(() => {
        if (socket && sessionId && messages.length > 0) {
            // Reveal all spoilers up to the last message (host - global reveal)
            const lastMessageId = messages[messages.length - 1].id;
            socket.emit('reveal_spoilers', {
                sessionId,
                upToMessageId: lastMessageId,
            });
        }
    }, [socket, sessionId, messages]);

    const revealMySpoilers = useCallback(() => {
        if (messages.length > 0) {
            // Personal reveal - just update local state without emitting to server
            // This reveals all current message spoilers for the current user only
            setRevealedMessageIds((prev) => {
                const newSet = new Set(prev);
                messages.forEach((m) => newSet.add(m.id));
                return newSet;
            });

            // Also set all phase visibilities to 'revealed'
            setPhaseVisibilityState({
                nose: 'revealed',
                palate: 'revealed',
                finish: 'revealed',
                texture: 'revealed',
                untagged: 'revealed',
            });
        }
    }, [messages]);

    const updateRating = useCallback((rating: number) => {
        if (socket && sessionId) {
            socket.emit('update_rating', {
                sessionId,
                rating,
            });
        }
    }, [socket, sessionId]);

    const setPhaseVisibility = useCallback((phase: string, visibility: 'normal' | 'hidden' | 'revealed') => {
        setPhaseVisibilityState((prev) => ({
            ...prev,
            [phase]: visibility,
        }));
    }, []);

    const setAllPhaseVisibility = useCallback((visibility: 'normal' | 'hidden' | 'revealed') => {
        setPhaseVisibilityState({
            nose: visibility,
            palate: visibility,
            finish: visibility,
            texture: visibility,
            untagged: visibility,
        });

        if (visibility === 'revealed') {
            revealMySpoilers();
        }
    }, [revealMySpoilers]);

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
            hostId,
            revealedMessageIds,
            globallyRevealedMessageIds,
            updateRating,
            averageRating,
            phaseVisibility,
            setPhaseVisibility,
            setAllPhaseVisibility,
            livestreamUrl,
            customTags,
            canModerate: hostId === currentUserId || moderators.includes(currentUserId || ''),
            currentUserId,
            recentTags,
            isAnalyzing,
            summaryId,
            updateRecentTags,
            setLivestreamUrl,
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

