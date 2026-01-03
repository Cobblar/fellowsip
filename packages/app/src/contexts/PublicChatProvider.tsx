import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicSessionLog, useSession } from '../api/sessions';
import type { ActiveUser, Message, BannedUser } from '../types';

// Re-export the context type from ChatContext or define a compatible one
// Since ChatRoom uses useChatContext, we need to mock the provider to match its expected interface
// We'll define the interface here to match what ChatRoom expects

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

// We need to access the internal context of ChatContext to provide a compatible value
// Since React Context is usually exported, we can import it. 
// However, ChatContext.tsx exports `useChatContext` and `ChatProvider`, but not the Context object itself directly in a way we can swap easily without modifying ChatContext.tsx to export the Context object.
// BUT, we can just create a new Provider that matches the interface and wrap ChatRoom with it.
// Wait, ChatRoom imports `useChatContext` which imports `ChatContext` from `../contexts/ChatContext`.
// If we want `ChatRoom` to use OUR context, we have to modify `ChatRoom` to accept a context or make `useChatContext` flexible.
// OR, we can modify `ChatContext.tsx` to export the Context object, and then use that Context object here to provide the value.

// Let's check ChatContext.tsx again. It does NOT export the Context object.
// So we must modify ChatContext.tsx to export `ChatContext`.

import { ChatContext } from './ChatContext';

export const PublicChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { id } = useParams<{ id: string }>();
    const { data: logData, isLoading: isLogLoading } = usePublicSessionLog(id!);
    const { data: sessionData, isLoading: isSessionLoading } = useSession(id!);
    const isSolo = sessionData?.session?.isSolo || false;
    const isLoading = isLogLoading || isSessionLoading;

    // State for local interactivity (spoilers)
    const [revealedMessageIds, setRevealedMessageIds] = useState<Set<string>>(new Set());

    // Phase visibility state (local only)
    const [phaseVisibility, setPhaseVisibilityState] = useState<Record<string, 'normal' | 'hidden' | 'revealed'>>({
        nose: 'normal',
        palate: 'normal',
        finish: 'normal',
        texture: 'normal',
        untagged: 'normal',
    });

    // Spoiler defaults (local only)
    const [spoilerDefaults, setSpoilerDefaultsState] = useState<Record<string, 'normal' | 'hidden' | 'revealed'>>(() => {
        try {
            const saved = localStorage.getItem('fellowsip_spoiler_defaults');
            return saved ? JSON.parse(saved) : {
                nose: 'normal',
                palate: 'normal',
                finish: 'normal',
                texture: 'normal',
                untagged: 'normal',
            };
        } catch (e) {
            return {
                nose: 'normal',
                palate: 'normal',
                finish: 'normal',
                texture: 'normal',
                untagged: 'normal',
            };
        }
    });

    // Load session-specific spoiler settings
    useEffect(() => {
        if (isSolo) {
            setPhaseVisibilityState({
                nose: 'normal',
                palate: 'normal',
                finish: 'normal',
                texture: 'normal',
                untagged: 'normal',
            });
        } else if (id) {
            try {
                const sessionKey = `fellowsip_spoiler_${id}`;
                const sessionSaved = localStorage.getItem(sessionKey);
                if (sessionSaved) {
                    setPhaseVisibilityState(JSON.parse(sessionSaved));
                } else {
                    // Apply defaults
                    setPhaseVisibilityState(spoilerDefaults);
                }
            } catch (e) {
                // Ignore errors
            }
        }
    }, [id, isSolo, spoilerDefaults]);

    // Save settings when changed
    useEffect(() => {
        if (id) {
            const sessionKey = `fellowsip_spoiler_${id}`;
            localStorage.setItem(sessionKey, JSON.stringify(phaseVisibility));
        }
    }, [phaseVisibility, id]);

    useEffect(() => {
        localStorage.setItem('fellowsip_spoiler_defaults', JSON.stringify(spoilerDefaults));
    }, [spoilerDefaults]);

    const setSpoilerDefault = useCallback((phase: string, visibility: 'normal' | 'hidden' | 'revealed') => {
        setSpoilerDefaultsState(prev => ({ ...prev, [phase]: visibility }));
    }, []);

    const setPhaseVisibility = useCallback((phase: string, visibility: 'normal' | 'hidden' | 'revealed') => {
        setPhaseVisibilityState((prev) => ({
            ...prev,
            [phase]: visibility,
        }));
    }, []);

    const revealMySpoilers = useCallback(() => {
        if (logData?.messages) {
            setRevealedMessageIds((prev) => {
                const newSet = new Set(prev);
                logData.messages.forEach((m: Message) => newSet.add(m.id));
                return newSet;
            });
            setPhaseVisibilityState({
                nose: 'revealed',
                palate: 'revealed',
                finish: 'revealed',
                texture: 'revealed',
                untagged: 'revealed',
            });
        }
    }, [logData]);

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


    // Mock values for read-only mode
    const contextValue: ChatContextType = {
        activeUsers: [], // No live active users
        messages: logData?.messages || [],
        moderators: [],
        isConnected: false, // Not connected to socket
        error: null,
        sendMessage: () => { }, // No-op
        injectDebugHistory: () => { },
        deleteMessage: () => { },
        editMessage: () => { },
        makeModerator: () => { },
        revealAllSpoilers: () => { },
        revealMySpoilers,
        sessionId: id || null,
        sessionEnded: true, // Always treated as ended/read-only
        sessionEndedBy: 'System',
        sessionEndedLive: false,
        hostId: null,
        revealedMessageIds,
        globallyRevealedMessageIds: new Set(),
        updateRating: () => { },
        updateValueGrade: () => { },
        averageRating: null, // Could fetch from summary if needed, but log endpoint might not have it
        averageRatings: {},
        valueGradeDistributions: {},
        phaseVisibility,
        setPhaseVisibility,
        setAllPhaseVisibility,
        spoilerDefaults,
        setSpoilerDefault,
        livestreamUrl: null, // As requested/native behavior
        customTags: [],
        canModerate: false,
        currentUserId: null, // Public user has no ID
        recentTags: [],
        isAnalyzing: false,
        summaryId: null,
        updateRecentTags: async () => { },
        setLivestreamUrl: () => { },
        readyCheckActive: false,
        readyUsers: new Set(),
        startReadyCheck: () => { },
        endReadyCheck: () => { },
        markReady: () => { },
        markUnready: () => { },
        isMuted: false,
        mutedUsers: [],
        kickedUsers: [],
        muteUser: () => { },
        unmuteUser: () => { },
        kickUser: () => { },
        unkickUser: () => { },
        getBannedUsers: () => { },
        unmodUser: () => { },
        isSolo,
        sessionTags: [],
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <ChatContext.Provider value={contextValue}>
            {children}
        </ChatContext.Provider>
    );
};
