import type { Server, Socket } from 'socket.io';
import { lucia } from '../auth/lucia.js';
import { getSession, updateSessionActivity, addSessionParticipant } from '../services/sessions.js';
import { getSessionMessages } from '../services/messages.js';
import {
  addUserToSession,
  removeUserFromSession,
  getSessionUsers,
  removeUserFromAllSessions,
  getSessionModerators,
  isReadyCheckActive,
  getReadyUsers,
} from '../services/activeUsers.js';
import { isAutoModFriend } from '../services/friends.js';
import { registerUserSocket, unregisterUserSocket } from './socketManager.js';
import type { JoinSessionPayload } from '../types/socket.js';

// Import sub-handlers
import { setupModerationHandlers } from './socketModeration.js';
import { setupReadyCheckHandlers } from './socketReadyCheck.js';
import { setupMessageHandlers } from './socketMessages.js';

export function setupSocketHandlers(io: Server) {
  io.on('connection', async (socket: Socket) => {
    console.log('Socket connected:', socket.id);

    // Authenticate socket connection
    const sessionCookie = socket.handshake.headers.cookie;
    let userId: string | null = null;
    let user: any = null;

    if (sessionCookie) {
      const cookies = Object.fromEntries(
        sessionCookie.split('; ').map((c) => c.split('='))
      );
      const sessionId = cookies[lucia.sessionCookieName];

      if (sessionId) {
        try {
          const result = await lucia.validateSession(sessionId);
          if (result.user) {
            userId = result.user.id;
            user = result.user;
            console.log('Socket auth success:', { userId, displayName: user.displayName });
          }
        } catch (error) {
          console.error('Socket auth error:', error);
        }
      }
    }

    if (!userId || !user) {
      socket.emit('error', { message: 'Unauthorized' });
      socket.disconnect();
      return;
    }

    // Register this socket for targeted notifications
    registerUserSocket(userId, socket.id);

    // Helper to broadcast active users with moderators
    const broadcastActiveUsers = (sessionId: string) => {
      const activeUsers = getSessionUsers(sessionId);
      const moderators = getSessionModerators(sessionId);
      io.to(sessionId).emit('active_users', { users: activeUsers, moderators });
    };

    // Join session event
    socket.on('join_session', async (payload: JoinSessionPayload) => {
      try {
        const { sessionId } = payload;

        // Validate session exists
        const session = await getSession(sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Check if user is kicked from this session
        const { isUserKicked } = await import('../services/activeUsers.js');
        const { isParticipantBanned } = await import('../services/sessions.js');
        if (isUserKicked(sessionId, userId!) || await isParticipantBanned(sessionId, userId!)) {
          socket.emit('you_were_kicked', {
            sessionId,
            message: 'You have been removed from this session.',
          });
          return;
        }

        // Check session timeout or if session has ended
        const SESSION_TIMEOUT_MS = 6 * 60 * 60 * 1000;
        const sessionAge = Date.now() - new Date(session.session.startedAt).getTime();
        const isExpired = sessionAge > SESSION_TIMEOUT_MS || session.session.status === 'ended';

        if (isExpired) {
          const messageHistory = await getSessionMessages(sessionId);
          socket.emit('message_history', {
            messages: messageHistory.map((m) => ({
              id: m.message.id,
              sessionId: m.message.sessionId,
              userId: m.message.userId,
              content: m.message.content,
              phase: m.message.phase,
              createdAt: m.message.createdAt,
              user: {
                id: m.user?.id || '',
                displayName: m.user?.displayName || null,
                avatarUrl: m.user?.avatarUrl || null,
              },
            })),
            livestreamUrl: null,
            customTags: session.session.customTags,
            hostId: session.session.hostId,
            isReadOnly: true,
          });

          socket.emit('session_ended', {
            sessionId,
            hostName: 'System',
            message: session.session.status === 'ended' ? 'This session has ended.' : 'This session has expired (6 hour limit).',
          });
          return;
        }

        // Join the Socket.io room
        await socket.join(sessionId);

        // Add user to active users
        await addSessionParticipant(sessionId, userId!);

        const { getUserProductRatings } = await import('../services/participants.js');
        const productRatingsData = await getUserProductRatings(sessionId, userId!);

        addUserToSession(sessionId, {
          userId: userId!,
          socketId: socket.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          rating: productRatingsData[0] ?? null,
          ratings: productRatingsData,
        });

        // Auto-mod logic
        const { addModerator } = await import('../services/activeUsers.js');
        if (userId !== session.session.hostId) {
          const shouldAutoMod = await isAutoModFriend(session.session.hostId, userId!);
          if (shouldAutoMod) {
            addModerator(sessionId, userId!);
          }
        }

        // Get message history
        const messageHistory = await getSessionMessages(sessionId);
        socket.emit('message_history', {
          messages: messageHistory.map((m) => ({
            id: m.message.id,
            sessionId: m.message.sessionId,
            userId: m.message.userId,
            content: m.message.content,
            phase: m.message.phase,
            createdAt: m.message.createdAt,
            user: {
              id: m.user?.id || '',
              displayName: m.user?.displayName || null,
              avatarUrl: m.user?.avatarUrl || null,
            },
          })),
          livestreamUrl: session.session.livestreamUrl,
          customTags: session.session.customTags,
          hostId: session.session.hostId,
        });

        broadcastActiveUsers(sessionId);

        if (isReadyCheckActive(sessionId)) {
          socket.emit('ready_check_state', {
            isActive: true,
            readyUsers: getReadyUsers(sessionId),
            totalUsers: getSessionUsers(sessionId).length,
          });
        }

        socket.to(sessionId).emit('user_joined', {
          user: {
            userId: userId!,
            socketId: socket.id,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
          },
          userCount: getSessionUsers(sessionId).length,
        });

        await updateSessionActivity(sessionId);
      } catch (error) {
        console.error('Join session error:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // Setup sub-handlers
    setupModerationHandlers(io, socket, userId!, user);
    setupReadyCheckHandlers(io, socket, userId!, user);
    setupMessageHandlers(io, socket, userId!, user);

    // Leave session event
    socket.on('leave_session', async (payload: JoinSessionPayload) => {
      try {
        const { sessionId } = payload;
        await socket.leave(sessionId);
        removeUserFromSession(sessionId, socket.id);
        broadcastActiveUsers(sessionId);
        socket.to(sessionId).emit('user_left', {
          userId: userId!,
          userCount: getSessionUsers(sessionId).length,
        });
      } catch (error) {
        console.error('Leave session error:', error);
      }
    });

    // Disconnect event
    socket.on('disconnect', () => {
      removeUserFromAllSessions(socket.id);
      if (userId) {
        unregisterUserSocket(userId, socket.id);
      }
      console.log('Socket disconnected:', socket.id);
    });
  });
}
