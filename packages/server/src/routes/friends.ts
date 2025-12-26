import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriends,
    getPendingRequests,
    getSentRequests,
    removeFriend,
    getFriendsActiveSessions,
    requestToJoinSession,
    getSessionJoinRequests,
    approveJoinRequest,
    rejectJoinRequest,
    getMyJoinRequests,
    updateAutoMod,
} from '../services/friends.js';

export async function friendRoutes(fastify: FastifyInstance) {
    // Send a friend request by email
    fastify.post('/friends/request', { preHandler: requireAuth }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const { email } = request.body as { email: string };

            if (!email) {
                return reply.status(400).send({ error: 'Email is required' });
            }

            const result = await sendFriendRequest(user.id, email);
            return reply.send({
                message: 'Friend request sent',
                friendship: result.friendship,
                receiver: {
                    id: result.receiver.id,
                    displayName: result.receiver.displayName,
                    email: result.receiver.email,
                },
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to send friend request';
            return reply.status(400).send({ error: message });
        }
    });

    // Get list of accepted friends
    fastify.get('/friends', { preHandler: requireAuth }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const friends = await getFriends(user.id);
            return reply.send({ friends });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get friends';
            return reply.status(500).send({ error: message });
        }
    });

    // Get pending incoming friend requests
    fastify.get('/friends/pending', { preHandler: requireAuth }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const requests = await getPendingRequests(user.id);
            return reply.send({ requests });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get pending requests';
            return reply.status(500).send({ error: message });
        }
    });

    // Get sent friend requests
    fastify.get('/friends/sent', { preHandler: requireAuth }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const requests = await getSentRequests(user.id);
            return reply.send({ requests });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get sent requests';
            return reply.status(500).send({ error: message });
        }
    });

    // Get friends' active sessions
    fastify.get('/friends/sessions', { preHandler: requireAuth }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const sessions = await getFriendsActiveSessions(user.id);
            return reply.send({ sessions });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get friends sessions';
            return reply.status(500).send({ error: message });
        }
    });

    // Get my join requests (to see status of requests I've made)
    fastify.get('/friends/my-join-requests', { preHandler: requireAuth }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const requests = await getMyJoinRequests(user.id);
            return reply.send({ requests });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get join requests';
            return reply.status(500).send({ error: message });
        }
    });

    // Accept a friend request
    fastify.post('/friends/:id/accept', { preHandler: requireAuth }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const { id } = request.params as { id: string };

            const friendship = await acceptFriendRequest(user.id, id);
            return reply.send({ message: 'Friend request accepted', friendship });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to accept friend request';
            return reply.status(400).send({ error: message });
        }
    });

    // Reject a friend request
    fastify.post('/friends/:id/reject', { preHandler: requireAuth }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const { id } = request.params as { id: string };

            const friendship = await rejectFriendRequest(user.id, id);
            return reply.send({ message: 'Friend request rejected', friendship });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to reject friend request';
            return reply.status(400).send({ error: message });
        }
    });

    // Remove a friend
    fastify.delete('/friends/:id', { preHandler: requireAuth }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const { id } = request.params as { id: string };

            await removeFriend(user.id, id);
            return reply.send({ message: 'Friend removed successfully' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to remove friend';
            return reply.status(400).send({ error: message });
        }
    });

    // Request to join a friend's session
    fastify.post('/friends/sessions/:sessionId/request-join', { preHandler: requireAuth }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const { sessionId } = request.params as { sessionId: string };

            const joinRequest = await requestToJoinSession(sessionId, user.id);
            return reply.send({ message: 'Join request sent', request: joinRequest });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to send join request';
            return reply.status(400).send({ error: message });
        }
    });

    // Get join requests for a session (host only)
    fastify.get('/friends/sessions/:sessionId/join-requests', { preHandler: requireAuth }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const { sessionId } = request.params as { sessionId: string };

            const requests = await getSessionJoinRequests(sessionId, user.id);
            return reply.send({ requests });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get join requests';
            return reply.status(400).send({ error: message });
        }
    });

    // Approve a join request (host only)
    fastify.post('/friends/join-requests/:requestId/approve', { preHandler: requireAuth }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const { requestId } = request.params as { requestId: string };

            const result = await approveJoinRequest(requestId, user.id);
            return reply.send({ message: 'Join request approved', ...result });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to approve join request';
            return reply.status(400).send({ error: message });
        }
    });

    // Reject a join request (host only)
    fastify.post('/friends/join-requests/:requestId/reject', { preHandler: requireAuth }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const { requestId } = request.params as { requestId: string };

            const result = await rejectJoinRequest(requestId, user.id);
            return reply.send({ message: 'Join request rejected', request: result });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to reject join request';
            return reply.status(400).send({ error: message });
        }
    });

    // Update auto-mod setting for a friend
    fastify.patch('/friends/:id/auto-mod', { preHandler: requireAuth }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const { id } = request.params as { id: string };
            const { autoMod } = request.body as { autoMod: boolean };

            if (typeof autoMod !== 'boolean') {
                return reply.status(400).send({ error: 'autoMod must be a boolean' });
            }

            const friendship = await updateAutoMod(user.id, id, autoMod);
            return reply.send({
                message: autoMod ? 'Auto-mod enabled' : 'Auto-mod disabled',
                friendship
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update auto-mod setting';
            return reply.status(400).send({ error: message });
        }
    });
}
