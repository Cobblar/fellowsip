import { eq, desc, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { notifications, type NewNotification } from '../db/schema.js';
import { emitToUser } from '../sockets/socketManager.js';

export type NotificationType =
    | 'friend_request'
    | 'friend_accepted'
    | 'join_request'
    | 'join_approved'
    | 'join_rejected'
    | 'session_started'
    | 'made_moderator'
    | 'session_synthesized';

// Create a new notification
export async function createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    metadata?: NewNotification['metadata'];
}) {
    const [notification] = await db
        .insert(notifications)
        .values({
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            link: data.link,
            metadata: data.metadata,
        })
        .returning();

    // Emit real-time notification to the user
    emitToUser(data.userId, 'new_notification', notification);

    return notification;
}

// Get notifications for a user
export async function getNotifications(userId: string, limit = 20) {
    return db.query.notifications.findMany({
        where: eq(notifications.userId, userId),
        orderBy: [desc(notifications.createdAt)],
        limit,
    });
}

// Get unread notification count
export async function getUnreadCount(userId: string) {
    const unreadNotifications = await db.query.notifications.findMany({
        where: and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
        ),
    });
    return unreadNotifications.length;
}

// Mark a notification as read
export async function markAsRead(notificationId: string, userId: string) {
    const [updated] = await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId)
        ))
        .returning();

    return updated;
}

// Mark all notifications as read for a user
export async function markAllAsRead(userId: string) {
    await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId));
}

// Delete a notification
export async function deleteNotification(notificationId: string, userId: string) {
    await db
        .delete(notifications)
        .where(and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId)
        ));
}

// Helper functions to create specific notification types

export async function notifyFriendRequest(receiverId: string, senderName: string, friendshipId: string) {
    return createNotification({
        userId: receiverId,
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${senderName} sent you a friend request`,
        link: '/profile',
        metadata: { fromUserName: senderName, friendshipId },
    });
}

export async function notifyFriendAccepted(senderId: string, accepterName: string) {
    return createNotification({
        userId: senderId,
        type: 'friend_accepted',
        title: 'Friend Request Accepted',
        message: `${accepterName} accepted your friend request`,
        link: '/profile',
        metadata: { fromUserName: accepterName },
    });
}

export async function notifyJoinRequest(hostId: string, requesterName: string, sessionId: string, sessionName: string) {
    return createNotification({
        userId: hostId,
        type: 'join_request',
        title: 'Join Request',
        message: `${requesterName} wants to join "${sessionName}"`,
        link: `/session/${sessionId}`,
        metadata: { fromUserName: requesterName, sessionId, sessionName },
    });
}

export async function notifyJoinApproved(requesterId: string, sessionId: string, sessionName: string) {
    return createNotification({
        userId: requesterId,
        type: 'join_approved',
        title: 'Join Request Approved',
        message: `Your request to join "${sessionName}" was approved`,
        link: `/session/${sessionId}`,
        metadata: { sessionId, sessionName },
    });
}

export async function notifyJoinRejected(requesterId: string, sessionName: string) {
    return createNotification({
        userId: requesterId,
        type: 'join_rejected',
        title: 'Join Request Declined',
        message: `Your request to join "${sessionName}" was declined`,
        metadata: { sessionName },
    });
}

export async function notifySessionStarted(friendId: string, hostName: string, sessionId: string, sessionName: string) {
    return createNotification({
        userId: friendId,
        type: 'session_started',
        title: 'Friend Started a Session',
        message: `${hostName} started a new session: "${sessionName}"`,
        link: `/session/${sessionId}`,
        metadata: { fromUserName: hostName, sessionId, sessionName },
    });
}

export async function notifyMadeModerator(userId: string, sessionId: string, sessionName: string) {
    return createNotification({
        userId,
        type: 'made_moderator',
        title: 'You\'re Now a Moderator',
        message: `You were made a moderator in "${sessionName}"`,
        link: `/session/${sessionId}`,
        metadata: { sessionId, sessionName },
    });
}

export async function notifySessionSynthesized(userId: string, sessionId: string, sessionName: string) {
    return createNotification({
        userId,
        type: 'session_synthesized',
        title: 'Session Summary Ready',
        message: `The tasting notes for "${sessionName}" have been synthesized`,
        link: `/session/${sessionId}/summary`,
        metadata: { sessionId, sessionName },
    });
}
