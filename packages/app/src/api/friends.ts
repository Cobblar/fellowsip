import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

interface Friend {
    friendshipId: string;
    friend: {
        id: string;
        displayName: string | null;
        email: string;
        avatarUrl: string | null;
    };
    autoMod: boolean; // Whether this friend is auto-modded when joining user's sessions
    createdAt: string;
}

interface FriendRequest {
    id: string;
    sender?: {
        id: string;
        displayName: string | null;
        email: string;
        avatarUrl: string | null;
    };
    receiver?: {
        id: string;
        displayName: string | null;
        email: string;
        avatarUrl: string | null;
    };
    createdAt: string;
}

interface FriendSession {
    id: string;
    name: string;
    startedAt: string;
    productType: string | null;
    host: {
        id: string;
        displayName: string | null;
        avatarUrl: string | null;
    };
}

interface JoinRequest {
    id: string;
    sessionId: string;
    requesterId: string;
    status: string;
    createdAt: string;
    requester?: {
        id: string;
        displayName: string | null;
        email: string;
        avatarUrl: string | null;
    };
}

// Query keys
export const friendKeys = {
    all: ['friends'] as const,
    list: () => [...friendKeys.all, 'list'] as const,
    pending: () => [...friendKeys.all, 'pending'] as const,
    sent: () => [...friendKeys.all, 'sent'] as const,
    sessions: () => [...friendKeys.all, 'sessions'] as const,
    joinRequests: (sessionId: string) => [...friendKeys.all, 'joinRequests', sessionId] as const,
    myJoinRequests: () => [...friendKeys.all, 'myJoinRequests'] as const,
};

// Get list of accepted friends
export function useFriends() {
    return useQuery({
        queryKey: friendKeys.list(),
        queryFn: () => api.get<{ friends: Friend[] }>('/friends'),
    });
}

// Get pending incoming friend requests
export function usePendingRequests() {
    return useQuery({
        queryKey: friendKeys.pending(),
        queryFn: () => api.get<{ requests: FriendRequest[] }>('/friends/pending'),
    });
}

// Get sent friend requests
export function useSentRequests() {
    return useQuery({
        queryKey: friendKeys.sent(),
        queryFn: () => api.get<{ requests: FriendRequest[] }>('/friends/sent'),
    });
}

// Get friends' active sessions
export function useFriendsSessions() {
    return useQuery({
        queryKey: friendKeys.sessions(),
        queryFn: () => api.get<{ sessions: FriendSession[] }>('/friends/sessions'),
    });
}

interface MyJoinRequest {
    id: string;
    sessionId: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    session: {
        id: string;
        name: string;
        status: string;
        productType: string | null;
    };
}

// Get my join requests (to track status of requests I've made)
export function useMyJoinRequests() {
    return useQuery({
        queryKey: friendKeys.myJoinRequests(),
        queryFn: () => api.get<{ requests: MyJoinRequest[] }>('/friends/my-join-requests'),
        // Real-time updates via socket events handle refreshes
    });
}

// Send friend request by email
export function useSendFriendRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (email: string) =>
            api.post<{ message: string; friendship: any; receiver: any }>('/friends/request', { email }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: friendKeys.sent() });
        },
    });
}

// Accept friend request
export function useAcceptFriendRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (friendshipId: string) =>
            api.post<{ message: string; friendship: any }>(`/friends/${friendshipId}/accept`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: friendKeys.list() });
            queryClient.invalidateQueries({ queryKey: friendKeys.pending() });
            queryClient.invalidateQueries({ queryKey: friendKeys.sessions() });
        },
    });
}

// Reject friend request
export function useRejectFriendRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (friendshipId: string) =>
            api.post<{ message: string; friendship: any }>(`/friends/${friendshipId}/reject`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: friendKeys.pending() });
        },
    });
}

// Remove friend
export function useRemoveFriend() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (friendshipId: string) =>
            api.delete<{ message: string }>(`/friends/${friendshipId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: friendKeys.list() });
            queryClient.invalidateQueries({ queryKey: friendKeys.sessions() });
        },
    });
}

// Request to join a friend's session
export function useRequestToJoin() {
    return useMutation({
        mutationFn: (sessionId: string) =>
            api.post<{ message: string; request: any }>(`/friends/sessions/${sessionId}/request-join`, {}),
    });
}

// Get join requests for a session (host only)
export function useSessionJoinRequests(sessionId: string) {
    return useQuery({
        queryKey: friendKeys.joinRequests(sessionId),
        queryFn: () => api.get<{ requests: JoinRequest[] }>(`/friends/sessions/${sessionId}/join-requests`),
        enabled: !!sessionId,
        // Real-time updates via socket events handle refreshes
    });
}

// Approve join request
export function useApproveJoinRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ requestId, sessionId }: { requestId: string; sessionId: string }) =>
            api.post<{ message: string; request: any; sessionId: string }>(`/friends/join-requests/${requestId}/approve`, {}),
        onSuccess: (_, { sessionId }) => {
            queryClient.invalidateQueries({ queryKey: friendKeys.joinRequests(sessionId) });
        },
    });
}

// Reject join request
export function useRejectJoinRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ requestId, sessionId }: { requestId: string; sessionId: string }) =>
            api.post<{ message: string; request: any }>(`/friends/join-requests/${requestId}/reject`, {}),
        onSuccess: (_, { sessionId }) => {
            queryClient.invalidateQueries({ queryKey: friendKeys.joinRequests(sessionId) });
        },
    });
}

// Update auto-mod setting for a friend
export function useUpdateAutoMod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ friendshipId, autoMod }: { friendshipId: string; autoMod: boolean }) =>
            api.patch<{ message: string; friendship: any }>(`/friends/${friendshipId}/auto-mod`, { autoMod }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: friendKeys.list() });
        },
    });
}
