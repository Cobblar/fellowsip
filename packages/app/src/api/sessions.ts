import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Session, Message } from '../types';

interface CreateSessionData {
  name: string;
  products?: Array<{
    productType?: string | null;
    productLink?: string | null;
    productName?: string | null;
  }>;
  livestreamUrl?: string;
  isSolo?: boolean;
}

interface SessionResponse {
  session: Session;
}

interface SessionsResponse {
  sessions: Session[];
}

interface MessagesResponse {
  messages: Message[];
}

// Query keys
export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: (filters?: string) => [...sessionKeys.lists(), { filters }] as const,
  details: () => [...sessionKeys.all, 'detail'] as const,
  detail: (id: string) => [...sessionKeys.details(), id] as const,
  messages: (id: string) => [...sessionKeys.detail(id), 'messages'] as const,
};

// Create session
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSessionData) => {
      const response = await api.post<SessionResponse>('/sessions', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
    },
  });
}

// Get all active sessions
export function useActiveSessions() {
  return useQuery({
    queryKey: sessionKeys.list('active'),
    queryFn: () => api.get<SessionsResponse>('/sessions'),
  });
}

// Get user's sessions
export function useUserSessions() {
  return useQuery({
    queryKey: sessionKeys.list('my'),
    queryFn: () => api.get<SessionsResponse>('/sessions/my'),
  });
}

// Get session details
export function useSession(id: string) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: () => api.get<SessionResponse>(`/sessions/${id}`),
    enabled: !!id,
  });
}

// Get session messages
export function useSessionMessages(id: string) {
  return useQuery({
    queryKey: sessionKeys.messages(id),
    queryFn: () => api.get<MessagesResponse>(`/sessions/${id}/messages`),
    enabled: !!id,
  });
}

// End session
export function useEndSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, shouldAnalyze = true }: { sessionId: string; shouldAnalyze?: boolean }) =>
      api.post<SessionResponse>(`/sessions/${sessionId}/end`, { shouldAnalyze }),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
    },
  });
}

// Get all summaries for a user
export function useAllSummaries() {
  return useQuery({
    queryKey: [...sessionKeys.all, 'summaries'] as const,
    queryFn: () => api.get<{ summaries: any[] }>('/summaries'),
  });
}

// Update session summary
export function useUpdateSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch<{ summary: any }>(`/sessions/${id}/summary`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: [...sessionKeys.all, 'summaries'] });
    },
  });
}

export function useUpdateProductDescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, productIndex, description }: {
      sessionId: string;
      productIndex: number;
      description: string;
    }) => {
      const res = await api.patch(`/sessions/${sessionId}/summary/description`, { productIndex, description });
      return res;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(variables.sessionId) });
      queryClient.invalidateQueries({ queryKey: [...sessionKeys.detail(variables.sessionId), 'public'] });
      queryClient.invalidateQueries({ queryKey: [...sessionKeys.detail(variables.sessionId), 'summary', variables.productIndex] });
    },
  });
}

// Transfer host
export function useTransferHost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, newHostId }: { sessionId: string; newHostId: string }) =>
      api.post<{ session: Session; newHost: any }>(`/sessions/${sessionId}/transfer-host`, { newHostId }),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
    },
  });
}

// Archive session
export function useArchiveSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) =>
      api.post<{ session: Session }>(`/sessions/${sessionId}/archive`, {}),
    onSuccess: async () => {
      // Cancel any in-flight queries first to prevent race conditions
      // that can cause stale data to mix with fresh data, creating visual duplicates
      await queryClient.cancelQueries({ queryKey: sessionKeys.lists() });
      await queryClient.cancelQueries({ queryKey: [...sessionKeys.all, 'summaries'] });
      // Then invalidate to trigger fresh fetches
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...sessionKeys.all, 'summaries'] });
      queryClient.invalidateQueries({ queryKey: [...sessionKeys.all, 'archived'] });
    },
  });
}

// Unarchive session
export function useUnarchiveSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) =>
      api.post<{ session: Session }>(`/sessions/${sessionId}/unarchive`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...sessionKeys.all, 'summaries'] });
      queryClient.invalidateQueries({ queryKey: [...sessionKeys.all, 'archived'] });
    },
  });
}

// Get archived sessions
export function useArchivedSessions() {
  return useQuery({
    queryKey: [...sessionKeys.all, 'archived'],
    queryFn: () => api.get<SessionsResponse>('/sessions/archived'),
  });
}

// Update participant sharing status
export function useUpdateSharing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: { sharePersonalSummary?: boolean; shareGroupSummary?: boolean; shareSessionLog?: boolean } }) =>
      api.patch<{ participant: any }>(`/sessions/${sessionId}/sharing`, data),
    onSuccess: (response, { sessionId }) => {
      const updatedParticipant = response.participant;

      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });

      // Manually update lists to ensure UI reflects changes immediately
      queryClient.setQueriesData<SessionsResponse>({ queryKey: sessionKeys.lists() }, (old) => {
        if (!old) return old;
        return {
          ...old,
          sessions: old.sessions.map((session) =>
            session.id === sessionId
              ? { ...session, ...updatedParticipant }
              : session
          ),
        };
      });

      // Manually update summary details
      queryClient.setQueryData<{ summary: any }>(
        [...sessionKeys.detail(sessionId), 'summary'],
        (old) => {
          if (!old || !old.summary) return old;
          return {
            ...old,
            summary: {
              ...old.summary,
              participants: old.summary.participants?.map((p: any) =>
                p.userId === updatedParticipant.userId
                  ? { ...p, ...updatedParticipant }
                  : p
              ),
            },
          };
        }
      );
    },
  });
}

// Get public session summary
export function usePublicSummary(id: string) {
  return useQuery({
    queryKey: [...sessionKeys.detail(id), 'public'],
    queryFn: () => api.get<{ summary: any }>(`/sessions/${id}/summary/public`),
    enabled: !!id,
  });
}

// Get private session summary
export function useSessionSummary(id: string, productIndex: number = 0, refetchInterval?: number | false) {
  return useQuery({
    queryKey: [...sessionKeys.detail(id), 'summary', productIndex],
    queryFn: () => api.get<{ summary: any }>(`/sessions/${id}/summary?productIndex=${productIndex}`),
    enabled: !!id,
    refetchInterval,
  });
}

// Get comparison summary
export function useComparisonSummary(id: string) {
  return useQuery({
    queryKey: [...sessionKeys.detail(id), 'comparison'],
    queryFn: () => api.get<{ comparison: any }>(`/sessions/${id}/comparison`),
    enabled: !!id,
  });
}

// Get public session log
export function usePublicSessionLog(id: string) {
  return useQuery({
    queryKey: [...sessionKeys.detail(id), 'public-log'],
    queryFn: () => api.get<{ messages: any[] }>(`/sessions/${id}/log/public`),
    enabled: !!id,
  });
}
// Toggle session highlight
export function useToggleHighlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) =>
      api.patch<{ participant: any }>(`/sessions/${sessionId}/highlight`, {}),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...sessionKeys.all, 'summaries'] });
    },
  });
}
