import { db, sessionParticipants, messages, users } from '../db/index.js';
import { eq } from 'drizzle-orm';

export async function getPublicSessionLog(sessionId: string) {
    const allParticipants = await db
        .select({
            shareSessionLog: sessionParticipants.shareSessionLog,
        })
        .from(sessionParticipants)
        .where(eq(sessionParticipants.sessionId, sessionId));

    if (allParticipants.length === 0) return [];

    const allShared = allParticipants.every(p => p.shareSessionLog);
    if (!allShared) return [];

    const sessionMessages = await db
        .select({
            id: messages.id,
            content: messages.content,
            phase: messages.phase,
            createdAt: messages.createdAt,
            user: {
                id: users.id,
                displayName: users.displayName,
                avatarUrl: users.avatarUrl,
            }
        })
        .from(messages)
        .leftJoin(users, eq(messages.userId, users.id))
        .where(eq(messages.sessionId, sessionId))
        .orderBy(messages.createdAt);

    return sessionMessages;
}
