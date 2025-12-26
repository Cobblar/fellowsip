import { eq, and, or } from 'drizzle-orm';
import { db } from '../db';
import { users, friendships, tastingSessions, sessionJoinRequests } from '../db/schema';
import { notifyFriendRequest, notifyFriendAccepted, notifyJoinRequest, notifyJoinApproved, notifyJoinRejected } from './notifications.js';
import { emitToUser } from '../sockets/socketManager.js';

// Send a friend request by email
export async function sendFriendRequest(senderId: string, receiverEmail: string) {
    // Find the receiver by email
    const receiver = await db.query.users.findFirst({
        where: eq(users.email, receiverEmail),
    });

    if (!receiver) {
        throw new Error('User not found with that email address');
    }

    if (receiver.id === senderId) {
        throw new Error('You cannot send a friend request to yourself');
    }

    // Check if a friendship already exists (in either direction)
    const existingFriendship = await db.query.friendships.findFirst({
        where: or(
            and(
                eq(friendships.senderId, senderId),
                eq(friendships.receiverId, receiver.id)
            ),
            and(
                eq(friendships.senderId, receiver.id),
                eq(friendships.receiverId, senderId)
            )
        ),
    });

    if (existingFriendship) {
        if (existingFriendship.status === 'accepted') {
            throw new Error('You are already friends with this user');
        }
        if (existingFriendship.status === 'pending') {
            throw new Error('A friend request already exists between you and this user');
        }
    }

    // Create the friend request
    const [friendship] = await db
        .insert(friendships)
        .values({
            senderId,
            receiverId: receiver.id,
            status: 'pending',
        })
        .returning();

    // Get sender info for notification
    const sender = await db.query.users.findFirst({
        where: eq(users.id, senderId),
    });

    // Send notification to receiver
    if (sender) {
        await notifyFriendRequest(receiver.id, sender.displayName || sender.email, friendship.id);
    }

    return { friendship, receiver };
}

// Accept a friend request
export async function acceptFriendRequest(userId: string, friendshipId: string) {
    const friendship = await db.query.friendships.findFirst({
        where: and(
            eq(friendships.id, friendshipId),
            eq(friendships.receiverId, userId),
            eq(friendships.status, 'pending')
        ),
    });

    if (!friendship) {
        throw new Error('Friend request not found or already processed');
    }

    const [updated] = await db
        .update(friendships)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(eq(friendships.id, friendshipId))
        .returning();

    // Get accepter info and send notification to original sender
    const accepter = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });
    if (accepter) {
        await notifyFriendAccepted(friendship.senderId, accepter.displayName || accepter.email);
    }

    return updated;
}

// Reject a friend request
export async function rejectFriendRequest(userId: string, friendshipId: string) {
    const friendship = await db.query.friendships.findFirst({
        where: and(
            eq(friendships.id, friendshipId),
            eq(friendships.receiverId, userId),
            eq(friendships.status, 'pending')
        ),
    });

    if (!friendship) {
        throw new Error('Friend request not found or already processed');
    }

    const [updated] = await db
        .update(friendships)
        .set({ status: 'rejected', updatedAt: new Date() })
        .where(eq(friendships.id, friendshipId))
        .returning();

    return updated;
}

// Get list of accepted friends
export async function getFriends(userId: string) {
    const friendshipsList = await db.query.friendships.findMany({
        where: and(
            or(
                eq(friendships.senderId, userId),
                eq(friendships.receiverId, userId)
            ),
            eq(friendships.status, 'accepted')
        ),
        with: {
            sender: true,
            receiver: true,
        },
    });

    // Return the friend (the other user in each friendship)
    // Also return autoMod status (relevant from the perspective of the user who set it)
    return friendshipsList.map((f) => {
        const isSender = f.senderId === userId;
        return {
            friendshipId: f.id,
            friend: isSender ? f.receiver : f.sender,
            autoMod: f.autoMod, // Whether this friend should be auto-modded when joining user's sessions
            createdAt: f.createdAt,
        };
    });
}

// Update auto-mod setting for a friend
export async function updateAutoMod(userId: string, friendshipId: string, autoMod: boolean) {
    // Verify the friendship exists and user is part of it
    const friendship = await db.query.friendships.findFirst({
        where: and(
            eq(friendships.id, friendshipId),
            eq(friendships.status, 'accepted'),
            or(
                eq(friendships.senderId, userId),
                eq(friendships.receiverId, userId)
            )
        ),
    });

    if (!friendship) {
        throw new Error('Friendship not found');
    }

    const [updated] = await db
        .update(friendships)
        .set({ autoMod, updatedAt: new Date() })
        .where(eq(friendships.id, friendshipId))
        .returning();

    return updated;
}

// Check if a user should be auto-modded when joining a host's session
export async function isAutoModFriend(hostId: string, userId: string): Promise<boolean> {
    const friendship = await db.query.friendships.findFirst({
        where: and(
            or(
                and(
                    eq(friendships.senderId, hostId),
                    eq(friendships.receiverId, userId)
                ),
                and(
                    eq(friendships.senderId, userId),
                    eq(friendships.receiverId, hostId)
                )
            ),
            eq(friendships.status, 'accepted'),
            eq(friendships.autoMod, true)
        ),
    });

    return !!friendship;
}

// Get pending incoming friend requests
export async function getPendingRequests(userId: string) {
    const requests = await db.query.friendships.findMany({
        where: and(
            eq(friendships.receiverId, userId),
            eq(friendships.status, 'pending')
        ),
        with: {
            sender: true,
        },
        orderBy: (friendships, { desc }) => [desc(friendships.createdAt)],
    });

    return requests.map((r) => ({
        id: r.id,
        sender: r.sender,
        createdAt: r.createdAt,
    }));
}

// Get sent friend requests that are still pending
export async function getSentRequests(userId: string) {
    const requests = await db.query.friendships.findMany({
        where: and(
            eq(friendships.senderId, userId),
            eq(friendships.status, 'pending')
        ),
        with: {
            receiver: true,
        },
        orderBy: (friendships, { desc }) => [desc(friendships.createdAt)],
    });

    return requests.map((r) => ({
        id: r.id,
        receiver: r.receiver,
        createdAt: r.createdAt,
    }));
}

// Remove an existing friendship
export async function removeFriend(userId: string, friendshipId: string) {
    const friendship = await db.query.friendships.findFirst({
        where: and(
            eq(friendships.id, friendshipId),
            eq(friendships.status, 'accepted'),
            or(
                eq(friendships.senderId, userId),
                eq(friendships.receiverId, userId)
            )
        ),
    });

    if (!friendship) {
        throw new Error('Friendship not found');
    }

    await db.delete(friendships).where(eq(friendships.id, friendshipId));

    return { success: true };
}

// Get friends' active sessions (for "Friend's Sessions" feature)
export async function getFriendsActiveSessions(userId: string) {
    // First, get the list of friend IDs
    const friendsList = await getFriends(userId);
    const friendIds = friendsList.map((f) => f.friend.id);

    if (friendIds.length === 0) {
        return [];
    }

    // Get active sessions where the host is a friend
    const activeSessions = await db.query.tastingSessions.findMany({
        where: and(
            eq(tastingSessions.status, 'active'),
            or(...friendIds.map((id) => eq(tastingSessions.hostId, id)))
        ),
        with: {
            host: {
                columns: {
                    id: true,
                    displayName: true,
                    avatarUrl: true,
                },
            },
        },
        columns: {
            id: true,
            name: true,
            startedAt: true,
        },
    });

    return activeSessions;
}

// Request to join a friend's session
export async function requestToJoinSession(sessionId: string, requesterId: string) {
    // Verify the session exists and is active
    const session = await db.query.tastingSessions.findFirst({
        where: and(
            eq(tastingSessions.id, sessionId),
            eq(tastingSessions.status, 'active')
        ),
    });

    if (!session) {
        throw new Error('Session not found or not active');
    }

    // Check requester is a friend of the host
    const friendsList = await getFriends(requesterId);
    const isFriend = friendsList.some((f) => f.friend.id === session.hostId);

    if (!isFriend) {
        throw new Error('You can only request to join sessions hosted by friends');
    }

    // Check if a request already exists
    const existingRequest = await db.query.sessionJoinRequests.findFirst({
        where: and(
            eq(sessionJoinRequests.sessionId, sessionId),
            eq(sessionJoinRequests.requesterId, requesterId),
            eq(sessionJoinRequests.status, 'pending')
        ),
    });

    if (existingRequest) {
        throw new Error('You have already requested to join this session');
    }

    const [request] = await db
        .insert(sessionJoinRequests)
        .values({
            sessionId,
            requesterId,
            status: 'pending',
        })
        .returning();

    // Notify the host about the join request
    const requester = await db.query.users.findFirst({
        where: eq(users.id, requesterId),
    });
    if (requester) {
        await notifyJoinRequest(
            session.hostId,
            requester.displayName || requester.email,
            sessionId,
            session.name
        );
        // Emit socket event for real-time update
        emitToUser(session.hostId, 'join_request_received', {
            sessionId,
            request,
            requester: {
                id: requester.id,
                displayName: requester.displayName,
                email: requester.email,
            },
        });
    }

    return request;
}

// Get pending join requests for a session (host only)
export async function getSessionJoinRequests(sessionId: string, hostId: string) {
    // Verify the user is the host
    const session = await db.query.tastingSessions.findFirst({
        where: and(
            eq(tastingSessions.id, sessionId),
            eq(tastingSessions.hostId, hostId)
        ),
    });

    if (!session) {
        throw new Error('Session not found or you are not the host');
    }

    const requests = await db.query.sessionJoinRequests.findMany({
        where: and(
            eq(sessionJoinRequests.sessionId, sessionId),
            eq(sessionJoinRequests.status, 'pending')
        ),
        with: {
            requester: {
                columns: {
                    id: true,
                    displayName: true,
                    avatarUrl: true,
                    email: true,
                },
            },
        },
    });

    return requests;
}

// Approve a join request (host only)
export async function approveJoinRequest(requestId: string, hostId: string) {
    const request = await db.query.sessionJoinRequests.findFirst({
        where: eq(sessionJoinRequests.id, requestId),
        with: {
            session: true,
        },
    });

    if (!request) {
        throw new Error('Join request not found');
    }

    if (request.session.hostId !== hostId) {
        throw new Error('Only the host can approve join requests');
    }

    const [updated] = await db
        .update(sessionJoinRequests)
        .set({ status: 'approved' })
        .where(eq(sessionJoinRequests.id, requestId))
        .returning();

    // Notify the requester that their request was approved
    await notifyJoinApproved(request.requesterId, request.sessionId, request.session.name);

    // Emit socket event for real-time update
    emitToUser(request.requesterId, 'join_request_updated', {
        requestId,
        status: 'approved',
        sessionId: request.sessionId,
    });

    return {
        request: updated,
        sessionId: request.sessionId,
    };
}

// Reject a join request (host only)
export async function rejectJoinRequest(requestId: string, hostId: string) {
    const request = await db.query.sessionJoinRequests.findFirst({
        where: eq(sessionJoinRequests.id, requestId),
        with: {
            session: true,
        },
    });

    if (!request) {
        throw new Error('Join request not found');
    }

    if (request.session.hostId !== hostId) {
        throw new Error('Only the host can reject join requests');
    }

    const [updated] = await db
        .update(sessionJoinRequests)
        .set({ status: 'rejected' })
        .where(eq(sessionJoinRequests.id, requestId))
        .returning();

    // Notify the requester that their request was rejected
    await notifyJoinRejected(request.requesterId, request.session.name);

    // Emit socket event for real-time update
    emitToUser(request.requesterId, 'join_request_updated', {
        requestId,
        status: 'rejected',
    });

    return updated;
}

// Get user's own join requests (to see status of requests they've made)
export async function getMyJoinRequests(userId: string) {
    const requests = await db.query.sessionJoinRequests.findMany({
        where: eq(sessionJoinRequests.requesterId, userId),
        with: {
            session: {
                columns: {
                    id: true,
                    name: true,
                    status: true,
                },
            },
        },
    });

    return requests.map((r) => ({
        id: r.id,
        sessionId: r.sessionId,
        status: r.status,
        createdAt: r.createdAt,
        session: r.session,
    }));
}
