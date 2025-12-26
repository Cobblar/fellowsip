import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from '../services/notifications.js';

export async function notificationRoutes(fastify: FastifyInstance) {
    // Get all notifications for the current user
    fastify.get('/notifications', { preHandler: requireAuth }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const notifications = await getNotifications(user.id);
            const unreadCount = await getUnreadCount(user.id);
            return reply.send({ notifications, unreadCount });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get notifications';
            return reply.status(500).send({ error: message });
        }
    });

    // Get unread notification count only
    fastify.get('/notifications/unread-count', { preHandler: requireAuth }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const count = await getUnreadCount(user.id);
            return reply.send({ count });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get unread count';
            return reply.status(500).send({ error: message });
        }
    });

    // Mark a notification as read
    fastify.post('/notifications/:id/read', { preHandler: requireAuth }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const { id } = request.params as { id: string };
            const notification = await markAsRead(id, user.id);
            return reply.send({ notification });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to mark as read';
            return reply.status(400).send({ error: message });
        }
    });

    // Mark all notifications as read
    fastify.post('/notifications/read-all', { preHandler: requireAuth }, async (request, reply) => {
        try {
            const user = (request as any).user;
            await markAllAsRead(user.id);
            return reply.send({ message: 'All notifications marked as read' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to mark all as read';
            return reply.status(400).send({ error: message });
        }
    });

    // Delete a notification
    fastify.delete('/notifications/:id', { preHandler: requireAuth }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const { id } = request.params as { id: string };
            await deleteNotification(id, user.id);
            return reply.send({ message: 'Notification deleted' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete notification';
            return reply.status(400).send({ error: message });
        }
    });
}
