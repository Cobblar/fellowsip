import type { Server, Socket } from 'socket.io';
import { db } from '../db/index.js';
import { users as usersTable } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { createMessage, getSessionMessages, getMessage, updateMessage } from '../services/messages.js';
import { updateSessionActivity, updateParticipantRating, getAverageRating } from '../services/sessions.js';
import { isUserMuted, updateUserRating } from '../services/activeUsers.js';
import { checkRateLimit } from './socketRateLimiting.js';
import type {
    SendMessagePayload,
    EditMessagePayload,
    RevealSpoilersPayload,
    UpdateRatingPayload,
    RatingUpdatedEvent,
    MessageUpdatedEvent,
} from '../types/socket.js';

export function setupMessageHandlers(io: Server, socket: Socket, userId: string, user: any) {
    socket.on('send_message', async (payload: SendMessagePayload) => {
        try {
            const { sessionId, content, phase } = payload;

            if (!content.trim()) {
                socket.emit('error', { message: 'Message cannot be empty' });
                return;
            }

            if (content.length > 300) {
                socket.emit('error', { message: 'Message too long (max 300 characters)' });
                return;
            }

            // Rate limiting
            const rateLimit = checkRateLimit(userId, socket);
            if (rateLimit.isLimited) {
                socket.emit('error', {
                    message: rateLimit.message,
                    code: 'RATE_LIMIT_EXCEEDED',
                    remainingSeconds: rateLimit.remainingSeconds
                });
                return;
            }

            if (isUserMuted(sessionId, userId)) {
                socket.emit('you_were_muted', {
                    sessionId,
                    message: 'You have been muted in this session.',
                });
                return;
            }

            const messageData = await createMessage(sessionId, userId, content, phase);
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
            await updateSessionActivity(sessionId);
        } catch (error) {
            console.error('Send message error:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    socket.on('edit_message', async (payload: EditMessagePayload) => {
        try {
            const { sessionId, messageId, content } = payload;
            if (!content.trim()) {
                socket.emit('error', { message: 'Message content cannot be empty' });
                return;
            }

            const message = await getMessage(messageId);
            if (!message || message.userId !== userId) {
                socket.emit('error', { message: 'Unauthorized to edit this message' });
                return;
            }

            await updateMessage(messageId, content.trim());
            const event: MessageUpdatedEvent = {
                messageId,
                content: content.trim(),
            };
            io.to(sessionId).emit('message_updated', event);
        } catch (error) {
            console.error('Edit message error:', error);
            socket.emit('error', { message: 'Failed to edit message' });
        }
    });

    socket.on('reveal_spoilers', async (payload: RevealSpoilersPayload) => {
        try {
            const { sessionId, upToMessageId } = payload;
            const allMessages = await getSessionMessages(sessionId, 1000);
            const messageIds: string[] = [];

            for (const m of allMessages) {
                messageIds.push(m.message.id);
                if (m.message.id === upToMessageId) {
                    break;
                }
            }

            // We need to check if user is host. We'll need a helper or pass session info.
            // For now, we'll just re-fetch session.
            const { getSession } = await import('../services/sessions.js');
            const session = await getSession(sessionId);
            const isHost = session?.session.hostId === userId;

            if (isHost) {
                io.to(sessionId).emit('spoilers_revealed', {
                    messageIds,
                    revealedBy: user.displayName || 'Host',
                    isGlobal: true,
                });
            } else {
                socket.emit('spoilers_revealed', {
                    messageIds,
                    revealedBy: 'You',
                    isGlobal: false,
                });
            }
        } catch (error) {
            console.error('Reveal spoilers error:', error);
            socket.emit('error', { message: 'Failed to reveal spoilers' });
        }
    });

    socket.on('update_rating', async (payload: UpdateRatingPayload) => {
        const { sessionId, rating } = payload;
        try {
            await updateParticipantRating(sessionId, userId, rating);
            updateUserRating(sessionId, userId, rating);
            const averageRating = await getAverageRating(sessionId);
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
            ];

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
                { user: 'bot-mia', text: "The dry leaf has such a deep, roasted aroma. Very inviting.", phase: 'nose' },
                { user: 'bot-alex', text: "I'm getting strong notes of dark chocolate and dried plums.", phase: 'nose' },
                { user: 'bot-sam', text: "There's a hint of charcoal and maybe some toasted grains here.", phase: 'nose' },
                { user: 'bot-jordan', text: "After the rinse, it's much more floral. Like orchids in the rain.", phase: 'nose' },
                { user: 'bot-taylor', text: "I'm picking up a sweet, honey-like scent now. Very rich.", phase: 'nose' },
                { user: 'bot-mia', text: "First sip is incredibly smooth. Very balanced sweetness.", phase: 'palate' },
                { user: 'bot-alex', text: "The flavor is quite complex. I'm tasting stone fruits, maybe peach?", phase: 'palate' },
                { user: 'bot-sam', text: "It's got a nice mineral quality to it. Very clean and crisp.", phase: 'palate' },
                { user: 'bot-jordan', text: "I'm getting a bit of a nutty undertone, like roasted almonds.", phase: 'palate' },
                { user: 'bot-taylor', text: "There's a subtle spice here too. A tiny bit of cinnamon.", phase: 'palate' },
                { user: 'bot-mia', text: "The mouthfeel is so buttery and thick. Really coats the tongue.", phase: 'texture' },
                { user: 'bot-alex', text: "It's very silky. Almost like drinking liquid velvet.", phase: 'texture' },
                { user: 'bot-sam', text: "I find it quite light and refreshing, not too heavy at all.", phase: 'texture' },
                { user: 'bot-jordan', text: "There's a slight astringency that makes it feel very vibrant.", phase: 'texture' },
                { user: 'bot-taylor', text: "The viscosity is impressive. It feels very high quality.", phase: 'texture' },
                { user: 'bot-mia', text: "The finish is exceptionally long. Still tasting it minutes later.", phase: 'finish' },
                { user: 'bot-alex', text: "It leaves a wonderful cooling sensation in the throat. Very sweet.", phase: 'finish' },
                { user: 'bot-sam', text: "The aftertaste is slightly metallic but in a good, clean way.", phase: 'finish' },
                { user: 'bot-jordan', text: "I'm getting a lingering floral note on the breath. Beautiful.", phase: 'finish' },
                { user: 'bot-taylor', text: "||This is easily one of the best sessions I've had all year.||", phase: 'finish' },
            ];

            for (const msg of conversation) {
                const messageData = await createMessage(sessionId, msg.user, msg.text, msg.phase);
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
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (error) {
            console.error('Inject debug history error:', error);
            socket.emit('error', { message: 'Failed to inject debug history' });
        }
    });
}
