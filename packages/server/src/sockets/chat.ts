import type { Server, Socket } from 'socket.io';
import { lucia } from '../auth/lucia.js';
import { getSession } from '../services/sessions.js';
import { createMessage, getSessionMessages, hideMessage, getMessage } from '../services/messages.js';
import {
  addUserToSession,
  removeUserFromSession,
  getSessionUsers,
  removeUserFromAllSessions,
  addModerator,
  isModerator,
  getSessionModerators,
  updateUserRating,
} from '../services/activeUsers.js';
import { updateSessionActivity, addSessionParticipant, updateParticipantRating, getAverageRating } from '../services/sessions.js';
import { isAutoModFriend } from '../services/friends.js';
import { db } from '../db/index.js';
import { users as usersTable, sessionParticipants } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { registerUserSocket, unregisterUserSocket } from './socketManager.js';
import type {
  JoinSessionPayload,
  SendMessagePayload,
  DeleteMessagePayload,
  MakeModeratorPayload,
  RevealSpoilersPayload,
  UpdateRatingPayload,
  RatingUpdatedEvent,
} from '../types/socket.js';

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

        // Join the Socket.io room
        await socket.join(sessionId);

        // Add user to active users
        // Record participant in database
        await addSessionParticipant(sessionId, userId!);

        // Fetch user's current rating if any
        const participants = await db
          .select({ rating: sessionParticipants.rating })
          .from(sessionParticipants)
          .where(
            and(
              eq(sessionParticipants.sessionId, sessionId),
              eq(sessionParticipants.userId, userId!)
            )
          );
        const currentRating = participants[0]?.rating;

        addUserToSession(sessionId, {
          userId: userId!,
          socketId: socket.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          rating: currentRating,
        });

        // Check if user should be auto-modded (is a friend of host with autoMod enabled)
        if (userId !== session.session.hostId) {
          const shouldAutoMod = await isAutoModFriend(session.session.hostId, userId!);
          if (shouldAutoMod) {
            addModerator(sessionId, userId!);
            console.log(`Auto-promoted ${userId} to moderator for session ${sessionId}`);
          }
        }

        // Get message history
        const messageHistory = await getSessionMessages(sessionId);

        // Send message history to user
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
        });

        // Send active users to all in room (includes moderators)
        broadcastActiveUsers(sessionId);

        // Broadcast user joined
        socket.to(sessionId).emit('user_joined', {
          user: {
            userId: userId!,
            socketId: socket.id,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
          },
          userCount: getSessionUsers(sessionId).length,
        });

        // Update session activity
        await updateSessionActivity(sessionId);

        console.log(`User ${userId} joined session ${sessionId}`);
      } catch (error) {
        console.error('Join session error:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // Send message event
    socket.on('send_message', async (payload: SendMessagePayload) => {
      try {
        const { sessionId, content, phase } = payload;

        if (!content.trim()) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        // Save message to database
        const messageData = await createMessage(sessionId, userId!, content, phase);

        // Broadcast message to all users in room
        const messagePayload = {
          id: messageData.message.id,
          sessionId: messageData.message.sessionId,
          userId: messageData.message.userId,
          content: messageData.message.content,
          phase: messageData.message.phase,
          createdAt: messageData.message.createdAt,
          user: {
            id: messageData.user?.id || '',
            displayName: messageData.user?.displayName || null,
            avatarUrl: messageData.user?.avatarUrl || null,
          },
        };

        io.to(sessionId).emit('new_message', messagePayload);

        // Update session activity
        await updateSessionActivity(sessionId);

        console.log(`Message sent in session ${sessionId}`);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Delete message event (host or moderator only)
    socket.on('delete_message', async (payload: DeleteMessagePayload) => {
      try {
        const { sessionId, messageId } = payload;

        // Get the session to check host
        const session = await getSession(sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Check if user is host or moderator
        const isHost = session.session.hostId === userId;
        const isMod = isModerator(sessionId, userId!);

        if (!isHost && !isMod) {
          socket.emit('error', { message: 'Only host or moderators can delete messages' });
          return;
        }

        // Verify message exists and belongs to this session
        const message = await getMessage(messageId);
        if (!message || message.sessionId !== sessionId) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Hide the message
        await hideMessage(messageId);

        // Broadcast message deleted to all users in room
        io.to(sessionId).emit('message_deleted', {
          messageId,
          deletedBy: user.displayName || 'Moderator',
        });

        console.log(`Message ${messageId} deleted by ${userId} in session ${sessionId}`);
      } catch (error) {
        console.error('Delete message error:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Make moderator event (host only)
    socket.on('make_moderator', async (payload: MakeModeratorPayload) => {
      try {
        const { sessionId, userId: targetUserId } = payload;

        // Get the session to check host
        const session = await getSession(sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Only host can make moderators
        if (session.session.hostId !== userId) {
          socket.emit('error', { message: 'Only the host can assign moderators' });
          return;
        }

        // Can't make yourself a moderator (host has full power anyway)
        if (targetUserId === userId) {
          socket.emit('error', { message: 'Host already has full permissions' });
          return;
        }

        // Add user to moderators
        addModerator(sessionId, targetUserId);

        // Get target user info for broadcast
        const targetUser = getSessionUsers(sessionId).find(u => u.userId === targetUserId);

        // Broadcast moderator added to all users
        io.to(sessionId).emit('moderator_added', {
          userId: targetUserId,
          displayName: targetUser?.displayName || null,
        });

        // Also broadcast updated active users (includes moderator list)
        broadcastActiveUsers(sessionId);

        console.log(`User ${targetUserId} made moderator by ${userId} in session ${sessionId}`);
      } catch (error) {
        console.error('Make moderator error:', error);
        socket.emit('error', { message: 'Failed to assign moderator' });
      }
    });

    // Reveal spoilers event
    socket.on('reveal_spoilers', async (payload: RevealSpoilersPayload) => {
      try {
        const { sessionId, upToMessageId } = payload;

        // Get the session to check host
        const session = await getSession(sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Get all visible messages up to the specified message
        const allMessages = await getSessionMessages(sessionId, 1000);
        const messageIds: string[] = [];

        for (const m of allMessages) {
          messageIds.push(m.message.id);
          if (m.message.id === upToMessageId) {
            break;
          }
        }

        const isHost = session.session.hostId === userId;

        if (isHost) {
          // Host reveals for everyone
          io.to(sessionId).emit('spoilers_revealed', {
            messageIds,
            revealedBy: user.displayName || 'Host',
            isGlobal: true,
          });
          console.log(`Host ${userId} revealed spoilers globally in session ${sessionId}`);
        } else {
          // Regular user reveals only for themselves
          socket.emit('spoilers_revealed', {
            messageIds,
            revealedBy: 'You',
            isGlobal: false,
          });
          console.log(`User ${userId} revealed spoilers for self in session ${sessionId}`);
        }
      } catch (error) {
        console.error('Reveal spoilers error:', error);
        socket.emit('error', { message: 'Failed to reveal spoilers' });
      }
    });

    socket.on('update_rating', async (payload: UpdateRatingPayload) => {
      const { sessionId, rating } = payload;
      if (!userId) return;

      try {
        // Update in database
        await updateParticipantRating(sessionId, userId, rating);

        // Update in memory
        updateUserRating(sessionId, userId, rating);

        // Get new average
        const averageRating = await getAverageRating(sessionId);

        // Broadcast update
        const event: RatingUpdatedEvent = {
          userId,
          rating,
          averageRating,
        };
        io.to(sessionId).emit('rating_updated', event);
      } catch (err) {
        console.error('Failed to update rating:', err);
      }
    });

    // Debug: Inject chat history (Cobbler only)
    socket.on('inject_debug_history', async (payload: { sessionId: string }) => {
      const DEBUG_USER_ID = '108758497007070939011';
      if (userId !== DEBUG_USER_ID) {
        socket.emit('error', { message: 'Unauthorized debug action' });
        return;
      }

      try {
        const { sessionId } = payload;
        const participants = [
          { id: 'bot-mia', name: 'Mia', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia' },
          { id: 'bot-alex', name: 'Alex', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
          { id: 'bot-sam', name: 'Sam', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam' },
          { id: 'bot-jordan', name: 'Jordan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan' },
          { id: 'bot-taylor', name: 'Taylor', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor' },
          { id: 'bot-casey', name: 'Casey', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Casey' },
          { id: 'bot-riley', name: 'Riley', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Riley' },
          { id: 'bot-quinn', name: 'Quinn', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Quinn' },
          { id: 'bot-avery', name: 'Avery', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Avery' },
          { id: 'bot-charlie', name: 'Charlie', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie' },
        ];

        // Ensure bot users exist
        for (const p of participants) {
          const existing = await db.select().from(usersTable).where(eq(usersTable.id, p.id)).limit(1);
          if (existing.length === 0) {
            await db.insert(usersTable).values({
              id: p.id,
              email: `${p.id}@debug.fellowsip.com`,
              displayName: p.name,
              avatarUrl: p.avatar,
            });
          }
        }

        const conversation = [
          { user: 'bot-mia', text: "Wow, these dry leaves are stunning. So dark and twisted." },
          { user: 'bot-alex', text: "I'm getting a lot of dark chocolate and maybe some dried plum on the dry leaf." },
          { user: 'bot-sam', text: "Agreed, Alex. There's a subtle smokiness too, like a distant campfire." },
          { user: 'bot-jordan', text: "The aroma after the rinse is incredible. Super floral, like orchids." },
          { user: 'bot-taylor', text: "I'm getting more of a honey sweetness now. Very thick aroma." },
          { user: 'bot-casey', text: "First sip... oh that's buttery. Really nice mouthfeel." },
          { user: 'bot-riley', text: "It's got a bit of a mineral bite at the end, which I love. Very clean." },
          { user: 'bot-quinn', text: "The second infusion is opening up. More stone fruit coming through now. Peach?" },
          { user: 'bot-avery', text: "Definitely peach. And maybe a hint of cinnamon on the finish." },
          { user: 'bot-charlie', text: "This is holding up so well. Third infusion and it's still so vibrant." },
          { user: 'bot-mia', text: "||I think this might be my favorite tea of the year so far.||" },
          { user: 'bot-alex', text: "The aftertaste just lingers. Very sweet and cooling." },
          { user: 'bot-sam', text: "Anyone else getting a slight nutty note now? Like toasted almonds?" },
          { user: 'bot-jordan', text: "Yes! Toasted almonds for sure. It's evolving beautifully." },
          { user: 'bot-taylor', text: "The texture is what's really impressing me. So silky." },
          { user: 'bot-casey', text: "I'm on my fifth infusion and it's still giving so much flavor." },
          { user: 'bot-riley', text: "The finish is just... wow. So long and complex." },
          { user: 'bot-quinn', text: "I'm getting a bit of a cooling sensation in the throat now. Huigan is strong." },
          { user: 'bot-avery', text: "Agreed, the energy of this tea is very calming." },
          { user: 'bot-charlie', text: "What a great session. Thanks for hosting, Cobbler!" },
        ];

        for (const msg of conversation) {
          const messageData = await createMessage(sessionId, msg.user, msg.text);
          const messagePayload = {
            id: messageData.message.id,
            sessionId: messageData.message.sessionId,
            userId: messageData.message.userId,
            content: messageData.message.content,
            createdAt: messageData.message.createdAt,
            user: {
              id: messageData.user?.id || '',
              displayName: messageData.user?.displayName || null,
              avatarUrl: messageData.user?.avatarUrl || null,
            },
          };
          io.to(sessionId).emit('new_message', messagePayload);
          // Small delay to make it look a bit more natural in the broadcast
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`Debug history injected into session ${sessionId} by ${userId}`);
      } catch (error) {
        console.error('Inject debug history error:', error);
        socket.emit('error', { message: 'Failed to inject debug history' });
      }
    });

    // Leave session event
    socket.on('leave_session', async (payload: JoinSessionPayload) => {
      try {
        const { sessionId } = payload;

        // Leave the Socket.io room
        await socket.leave(sessionId);

        // Remove user from active users
        removeUserFromSession(sessionId, socket.id);

        // Send updated active users (includes moderators)
        broadcastActiveUsers(sessionId);

        // Broadcast user left
        socket.to(sessionId).emit('user_left', {
          userId: userId!,
          userCount: getSessionUsers(sessionId).length,
        });

        console.log(`User ${userId} left session ${sessionId}`);
      } catch (error) {
        console.error('Leave session error:', error);
      }
    });

    // Disconnect event
    socket.on('disconnect', () => {
      // Remove user from all sessions
      removeUserFromAllSessions(socket.id);
      // Unregister socket for targeted notifications
      if (userId) {
        unregisterUserSocket(userId, socket.id);
      }
      console.log('Socket disconnected:', socket.id);
    });
  });
}

