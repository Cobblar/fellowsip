import { useState, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { ActiveUser, ActiveUsersEvent, RatingUpdatedEvent, Message } from '../../types';

export const useChatSessionLogic = (socket: Socket | null, sessionId: string | null, setMessages: React.Dispatch<React.SetStateAction<Message[]>>) => {
    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
    const [moderators, setModerators] = useState<string[]>([]);
    const [hostId, setHostId] = useState<string | null>(null);
    const [averageRating, setAverageRating] = useState<number | null>(null);
    const [averageRatings, setAverageRatings] = useState<Record<number, number | null>>({});
    const [livestreamUrl, setLivestreamUrl] = useState<string | null>(null);
    const [customTags, setCustomTags] = useState<string[]>([]);
    const [sessionEnded, setSessionEnded] = useState(false);
    const [sessionEndedBy, setSessionEndedBy] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [summaryId, setSummaryId] = useState<string | null>(null);

    const updateRating = useCallback((rating: number, productIndex: number = 0) => {
        if (socket && sessionId) {
            socket.emit('update_rating', {
                sessionId,
                rating,
                productIndex,
            });
        }
    }, [socket, sessionId]);

    useEffect(() => {
        if (!socket) return;

        const handleActiveUsers = (data: ActiveUsersEvent) => {
            setActiveUsers(data.users);
            setModerators(data.moderators || []);
        };

        const handleRatingUpdated = (data: RatingUpdatedEvent) => {
            setActiveUsers((prev) => prev.map(user =>
                user.userId === data.userId ? {
                    ...user,
                    rating: data.productIndex === 0 ? data.rating : user.rating,
                    ratings: {
                        ...(user.ratings || {}),
                        [data.productIndex]: data.rating
                    }
                } : user
            ));
            setAverageRating(data.averageRating);
            if (data.averageRatings) {
                setAverageRatings(data.averageRatings);
            }
        };

        const handleLivestreamUpdated = (data: { sessionId: string; url: string | null }) => {
            setLivestreamUrl(data.url);
        };

        const handleCustomTagsUpdated = (data: { sessionId: string; tags: string[] }) => {
            setCustomTags(data.tags);
        };

        const handleSessionEnded = (data: { sessionId: string; hostName: string; message: string; shouldAnalyze?: boolean }) => {
            setSessionEnded(true);
            setSessionEndedBy(data.hostName);
            if (data.shouldAnalyze) {
                setIsAnalyzing(true);
            }
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
            setIsAnalyzing(false);
            setSummaryId(data.summaryId);
        };

        const handleHostTransferred = (data: { sessionId: string; newHostId: string; newHostName: string; message: string }) => {
            setHostId(data.newHostId);
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

        socket.on('active_users', handleActiveUsers);
        socket.on('rating_updated', handleRatingUpdated);
        socket.on('livestream_updated', handleLivestreamUpdated);
        socket.on('custom_tags_updated', handleCustomTagsUpdated);
        socket.on('session_ended', handleSessionEnded);
        socket.on('summary_generated', handleSummaryGenerated);
        socket.on('host_transferred', handleHostTransferred);

        return () => {
            socket.off('active_users', handleActiveUsers);
            socket.off('rating_updated', handleRatingUpdated);
            socket.off('livestream_updated', handleLivestreamUpdated);
            socket.off('custom_tags_updated', handleCustomTagsUpdated);
            socket.off('session_ended', handleSessionEnded);
            socket.off('summary_generated', handleSummaryGenerated);
            socket.off('host_transferred', handleHostTransferred);
        };
    }, [socket, setMessages]);

    return {
        activeUsers,
        moderators,
        hostId,
        averageRating,
        averageRatings,
        livestreamUrl,
        customTags,
        sessionEnded,
        sessionEndedBy,
        isAnalyzing,
        summaryId,
        updateRating,
        setHostId,
        setLivestreamUrl,
        setCustomTags,
        setSessionEnded,
        setSessionEndedBy,
        setIsAnalyzing,
        setSummaryId,
        setActiveUsers,
        setModerators,
        setAverageRating,
    };
};
