import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Session, Message } from '../types';

interface CreateSessionData {
  name: string;
  productType?: string;
  productLink?: string;
  productName?: string;
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
    onSuccess: () => {
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
