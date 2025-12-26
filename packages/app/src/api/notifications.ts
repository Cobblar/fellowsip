import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    isRead: boolean;
    metadata: {
        fromUserId?: string;
        fromUserName?: string;
        sessionId?: string;
        sessionName?: string;
        friendshipId?: string;
    } | null;
    createdAt: string;
}

// Query keys
export const notificationKeys = {
    all: ['notifications'] as const,
    list: () => [...notificationKeys.all, 'list'] as const,
    unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
};

// Get all notifications
export function useNotifications() {
    return useQuery({
        queryKey: notificationKeys.list(),
        queryFn: () => api.get<{ notifications: Notification[]; unreadCount: number }>('/notifications'),
        // Real-time updates via socket events handle refreshes
    });
}

// Get unread count only (lightweight polling)
export function useUnreadCount() {
    return useQuery({
        queryKey: notificationKeys.unreadCount(),
        queryFn: () => api.get<{ count: number }>('/notifications/unread-count'),
        // Real-time updates via socket events handle refreshes
    });
}

// Mark a notification as read
export function useMarkAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId: string) =>
            api.post<{ notification: Notification }>(`/notifications/${notificationId}/read`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
    });
}

// Mark all notifications as read
export function useMarkAllAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => api.post<{ message: string }>('/notifications/read-all', {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
    });
}

// Delete a notification
export function useDeleteNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId: string) =>
            api.delete<{ message: string }>(`/notifications/${notificationId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
    });
}
