import { useQuery } from '@tanstack/react-query';
import { api } from './client';

interface User {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
}

interface SessionResponse {
    user: User;
}

// Query keys
export const authKeys = {
    session: ['auth', 'session'] as const,
};

// Get current authenticated user
export function useCurrentUser() {
    return useQuery({
        queryKey: authKeys.session,
        queryFn: () => api.get<SessionResponse>('/auth/session'),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}
