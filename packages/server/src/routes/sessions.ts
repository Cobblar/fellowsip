import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import {
  createSession,
  getSession,
  getUserSessions,
  getActiveSessions,
  endSession,
  getSessionSummary,
  getAllUserSummaries,
  updateSessionSummary,
  updateParticipantRating,
  transferHost,
  archiveSession,
  unarchiveSession,
  getArchivedSessions,
  updateSessionDetails,
  addCustomTag,
  updateParticipantSharing,
  getPublicSummary,
  toggleSessionHighlight,
  getPublicSessionLog,
} from '../services/sessions.js';
import { getSessionMessages } from '../services/messages.js';
import { emitSessionEnded, emitHostTransferred, emitToUser, emitLivestreamUpdated, emitCustomTagsUpdated } from '../sockets/socketManager.js';
import { getFriends } from '../services/friends.js';

export async function sessionRoutes(fastify: FastifyInstance) {
  // Create new session (protected)
  fastify.post('/sessions', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { name, productType, productLink, productName, livestreamUrl, customTags } = request.body as {
        name: string;
        productType?: string;
        productLink?: string;
        productName?: string;
        livestreamUrl?: string;
        customTags?: string[];
      };

      if (!name) {
        return reply.status(400).send({ error: 'Session name is required' });
      }

      const session = await createSession(
        user.id,
        name,
        productType || null,
        productLink || null,
        productName || null,
        livestreamUrl || null,
        customTags || []
      );

      // Notify all friends that a new session started
      const friends = await getFriends(user.id);
      for (const { friend } of friends) {
        emitToUser(friend.id, 'friend_session_started', {
          sessionId: session.id,
          sessionName: session.name,
          hostId: user.id,
          hostName: user.displayName || user.email,
        });
      }

      return reply.send({ session });
    } catch (error) {
      console.error('Create session error:', error);
      return reply.status(500).send({ error: 'Failed to create session' });
    }
  });

  // Get all active sessions
  fastify.get('/sessions', async (_request, reply) => {
    try {
      const sessions = await getActiveSessions();

      return reply.send({
        sessions: sessions.map((s) => ({
          ...s.session,
          host: s.host,
          summaryId: s.summaryId,
        })),
      });
    } catch (error) {
      console.error('Get sessions error:', error);
      return reply.status(500).send({ error: 'Failed to get sessions' });
    }
  });

  // Get user's sessions (protected)
  fastify.get('/sessions/my', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const sessions = await getUserSessions(user.id);

      return reply.send({
        sessions: sessions.map((s) => ({
          ...s.session,
          host: s.host,
          summaryId: s.summaryId,
          userRating: s.userRating,
          isHighlighted: s.isHighlighted,
          sharePersonalSummary: s.sharePersonalSummary,
          shareGroupSummary: s.shareGroupSummary,
          shareSessionLog: s.shareSessionLog,
        })),
      });
    } catch (error) {
      console.error('Get user sessions error:', error);
      return reply.status(500).send({ error: 'Failed to get user sessions' });
    }
  });

  // Get session details
  fastify.get('/sessions/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const session = await getSession(id);

      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      return reply.send({
        session: {
          ...session.session,
          host: session.host,
        },
      });
    } catch (error) {
      console.error('Get session error:', error);
      return reply.status(500).send({ error: 'Failed to get session' });
    }
  });

  // Update session details (protected, host only)
  fastify.patch('/sessions/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { id } = request.params as { id: string };
      const data = request.body as {
        name?: string;
        productType?: string | null;
        productLink?: string | null;
        productName?: string | null;
        livestreamUrl?: string | null;
      };

      const session = await updateSessionDetails(id, user.id, data);

      if (data.livestreamUrl !== undefined) {
        emitLivestreamUpdated(id, data.livestreamUrl);
      }

      return reply.send({ session });
    } catch (error: any) {
      console.error('Update session error:', error);
      if (error.message?.includes('Unauthorized')) {
        return reply.status(403).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Failed to update session' });
    }
  });

  // Add custom tag (protected, host only)
  fastify.post('/sessions/:id/tags', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { id } = request.params as { id: string };
      const { tag } = request.body as { tag: string };

      if (!tag) {
        return reply.status(400).send({ error: 'Tag is required' });
      }

      const session = await addCustomTag(id, user.id, tag);
      emitCustomTagsUpdated(id, session.customTags);

      return reply.send({ tags: session.customTags });
    } catch (error: any) {
      console.error('Add custom tag error:', error);
      if (error.message?.includes('Unauthorized')) {
        return reply.status(403).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Failed to add custom tag' });
    }
  });

  // End session (protected, host only)
  fastify.post('/sessions/:id/end', { preHandler: requireAuth }, async (request, reply) => {
    console.log('[DEBUG] End session request received');
    console.log('[DEBUG] Params:', request.params);
    console.log('[DEBUG] User:', (request as any).user?.id);
    try {
      const user = (request as any).user;
      const { id } = request.params as { id: string };
      const { shouldAnalyze } = request.body as { shouldAnalyze?: boolean };

      const session = await endSession(id, user.id, shouldAnalyze);

      // Emit session ended event to all users in the session
      emitSessionEnded(id, user.displayName || 'The host', shouldAnalyze);

      // Notify all friends that the session ended
      const friends = await getFriends(user.id);
      for (const { friend } of friends) {
        emitToUser(friend.id, 'friend_session_ended', { sessionId: id });
      }

      return reply.send({ session });
    } catch (error: any) {
      console.error('End session error:', error);
      if (error.message?.includes('Unauthorized')) {
        return reply.status(403).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Failed to end session' });
    }
  });

  // Transfer host (protected, current host only)
  fastify.post('/sessions/:id/transfer-host', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { id } = request.params as { id: string };
      const { newHostId } = request.body as { newHostId: string };

      if (!newHostId) {
        return reply.status(400).send({ error: 'newHostId is required' });
      }

      const result = await transferHost(id, user.id, newHostId);

      // Emit host transferred event to all users in the session
      emitHostTransferred(id, result.newHost.id, result.newHost.displayName || 'New host');

      return reply.send({ session: result.session, newHost: result.newHost });
    } catch (error: any) {
      console.error('Transfer host error:', error);
      if (error.message?.includes('Unauthorized')) {
        return reply.status(403).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Failed to transfer host' });
    }
  });


  // Get session summary
  fastify.get('/sessions/:id/summary', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const summary = await getSessionSummary(id);

      if (!summary) {
        return reply.status(404).send({ error: 'Summary not found' });
      }

      return reply.send({ summary });
    } catch (error) {
      console.error('Get summary error:', error);
      return reply.status(500).send({ error: 'Failed to get summary' });
    }
  });

  // Get session messages
  fastify.get('/sessions/:id/messages', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const messages = await getSessionMessages(id);

      return reply.send({
        messages: messages.map((m) => ({
          id: m.message.id,
          sessionId: m.message.sessionId,
          userId: m.message.userId,
          content: m.message.content,
          createdAt: m.message.createdAt,
          user: {
            id: m.user?.id || '',
            displayName: m.user?.displayName || null,
            avatarUrl: m.user?.avatarUrl || null,
          },
        })),
      });
    } catch (error) {
      console.error('Get messages error:', error);
      return reply.status(500).send({ error: 'Failed to get messages' });
    }
  });

  // Get all summaries for a user
  fastify.get('/summaries', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const summaries = await getAllUserSummaries(user.id);

      return reply.send({ summaries });
    } catch (error) {
      console.error('Get all summaries error:', error);
      return reply.status(500).send({ error: 'Failed to get summaries' });
    }
  });

  // Update session summary (protected)
  fastify.patch('/sessions/:id/summary', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as {
        nose?: string;
        palate?: string;
        finish?: string;
        observations?: string;
        rating?: number;
      };

      const summary = await updateSessionSummary(id, data);

      // Also update the participant's rating if provided
      const user = (request as any).user;
      if (data.rating !== undefined && user) {
        await updateParticipantRating(id, user.id, data.rating);
      }

      return reply.send({ summary });
    } catch (error: any) {
      console.error('Update summary error:', error);
      if (error.message === 'Summary not found') {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Failed to update summary' });
    }
  });

  // Archive session (protected, host only)
  fastify.post('/sessions/:id/archive', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { id } = request.params as { id: string };

      const session = await archiveSession(id, user.id);

      return reply.send({ session });
    } catch (error: any) {
      console.error('Archive session error:', error);
      if (error.message?.includes('Unauthorized')) {
        return reply.status(403).send({ error: error.message });
      }
      return reply.status(400).send({ error: error.message });
    }
  });

  // Unarchive session (protected, host only)
  fastify.post('/sessions/:id/unarchive', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { id } = request.params as { id: string };

      const session = await unarchiveSession(id, user.id);

      return reply.send({ session });
    } catch (error: any) {
      console.error('Unarchive session error:', error);
      if (error.message?.includes('Unauthorized')) {
        return reply.status(403).send({ error: error.message });
      }
      return reply.status(400).send({ error: error.message });
    }
  });

  // Get archived sessions (protected)
  fastify.get('/sessions/archived', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const sessions = await getArchivedSessions(user.id);

      return reply.send({
        sessions: sessions.map((s) => ({
          ...s.session,
          host: s.host,
          summaryId: s.summaryId,
        })),
      });
    } catch (error) {
      console.error('Get archived sessions error:', error);
      return reply.status(500).send({ error: 'Failed to get archived sessions' });
    }
  });

  // Fetch URL metadata (protected)
  fastify.get('/sessions/metadata', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { url } = request.query as { url: string };
      if (!url) {
        return reply.status(400).send({ error: 'URL is required' });
      }

      const response = await fetch(url);
      const html = await response.text();

      // Simple regex to extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : null;

      return reply.send({ title });
    } catch (error) {
      console.error('Fetch metadata error:', error);
      return reply.status(500).send({ error: 'Failed to fetch metadata' });
    }
  });
  // Update participant sharing status (protected)
  fastify.patch('/sessions/:id/sharing', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { id } = request.params as { id: string };
      const data = request.body as {
        sharePersonalSummary?: boolean;
        shareGroupSummary?: boolean;
        shareSessionLog?: boolean;
      };

      const participant = await updateParticipantSharing(id, user.id, {
        sharePersonalSummary: data.sharePersonalSummary,
        shareGroupSummary: data.shareGroupSummary,
        shareSessionLog: data.shareSessionLog,
      });
      return reply.send({ participant });
    } catch (error) {
      console.error('Update sharing error:', error);
      return reply.status(500).send({ error: 'Failed to update sharing status' });
    }
  });

  // Get public session summary (public)
  fastify.get('/sessions/:id/summary/public', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const summary = await getPublicSummary(id);

      if (!summary) {
        return reply.status(404).send({ error: 'Summary not found or not public' });
      }

      return reply.send({ summary });
    } catch (error) {
      console.error('Get public summary error:', error);
      return reply.status(500).send({ error: 'Failed to get public summary' });
    }
  });

  // Get public session log (public)
  fastify.get('/sessions/:id/log/public', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const messages = await getPublicSessionLog(id);
      return reply.send({ messages });
    } catch (error) {
      console.error('Get public session log error:', error);
      return reply.status(500).send({ error: 'Failed to get public session log' });
    }
  });

  // Toggle session highlight (protected)
  fastify.patch('/sessions/:id/highlight', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { id } = request.params as { id: string };

      const participant = await toggleSessionHighlight(id, user.id);
      return reply.send({ participant });
    } catch (error: any) {
      console.error('Toggle highlight error:', error);
      if (error.message === 'Participant not found') {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Failed to toggle highlight' });
    }
  });
}
