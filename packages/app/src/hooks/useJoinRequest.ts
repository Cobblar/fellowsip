import { useState, useCallback } from 'react';
import { useMyJoinRequests, useRequestToJoin } from '../api/friends';

type JoinStatus = 'none' | 'pending' | 'approved' | 'rejected';

/**
 * Hook to manage join request state and actions for friend sessions.
 * Consolidates duplicated logic from Home.tsx and Summaries.tsx.
 */
export function useJoinRequest() {
    const { data: myJoinRequestsData } = useMyJoinRequests();
    const requestToJoin = useRequestToJoin();

    // Local state for immediate feedback before server confirms
    const [requestedSessions, setRequestedSessions] = useState<Set<string>>(new Set());

    const myJoinRequests = myJoinRequestsData?.requests || [];

    /**
     * Get the join request status for a session.
     * Checks server-side status first (source of truth), falls back to local state.
     */
    const getJoinStatus = useCallback((sessionId: string): JoinStatus => {
        // Check server-side status first (this is the source of truth)
        const request = myJoinRequests.find(r => r.sessionId === sessionId);
        if (request) return request.status;
        // Fall back to local state for immediate feedback before first poll completes
        if (requestedSessions.has(sessionId)) return 'pending';
        return 'none';
    }, [myJoinRequests, requestedSessions]);

    /**
     * Request to join a session. Provides immediate optimistic feedback.
     */
    const handleRequestToJoin = useCallback(async (sessionId: string) => {
        try {
            await requestToJoin.mutateAsync(sessionId);
            setRequestedSessions(prev => new Set(prev).add(sessionId));
        } catch (error) {
            console.error('Failed to request join:', error);
        }
    }, [requestToJoin]);

    return {
        getJoinStatus,
        handleRequestToJoin,
        isPending: requestToJoin.isPending,
    };
}
