import { db, tastingSessions, users } from '../db/index.js';
import { eq, sql } from 'drizzle-orm';
import { addSessionParticipant } from './participants.js';

export async function createSession(
    hostId: string,
    name: string,
    productType: string | null = null,
    productLink: string | null = null,
    productName: string | null = null,
    livestreamUrl: string | null = null,
    customTags: string[] = []
) {
    const [session] = await db
        .insert(tastingSessions)
        .values({
            name,
            productType,
            productLink,
            productName,
            livestreamUrl,
            customTags,
            hostId,
            status: 'active',
        })
        .returning();

    // Add host as a participant
    await addSessionParticipant(session.id, hostId);

    return session;
}

export async function getSession(sessionId: string) {
    const [session] = await db
        .select({
            session: tastingSessions,
            host: users,
        })
        .from(tastingSessions)
        .leftJoin(users, eq(tastingSessions.hostId, users.id))
        .where(eq(tastingSessions.id, sessionId));

    return session;
}

export async function updateSessionActivity(sessionId: string) {
    await db
        .update(tastingSessions)
        .set({
            lastActivityAt: sql`now()`,
            updatedAt: sql`now()`,
        })
        .where(eq(tastingSessions.id, sessionId));
}
