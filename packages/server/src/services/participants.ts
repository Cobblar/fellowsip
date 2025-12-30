import { db, sessionParticipants } from '../db/index.js';
import { eq, and, sql } from 'drizzle-orm';

export async function addSessionParticipant(sessionId: string, userId: string) {
    await db
        .insert(sessionParticipants)
        .values({
            sessionId,
            userId,
        })
        .onConflictDoNothing();
}

export async function updateParticipantRating(sessionId: string, userId: string, rating: number) {
    await db
        .insert(sessionParticipants)
        .values({
            sessionId,
            userId,
            rating,
        })
        .onConflictDoUpdate({
            target: [sessionParticipants.sessionId, sessionParticipants.userId],
            set: { rating },
        });
}

export async function getAverageRating(sessionId: string): Promise<number | null> {
    const result = await db
        .select({
            avgRating: sql<number>`avg(${sessionParticipants.rating})`,
        })
        .from(sessionParticipants)
        .where(
            and(
                eq(sessionParticipants.sessionId, sessionId),
                sql`${sessionParticipants.rating} is not null`
            )
        );

    return result[0]?.avgRating ? parseFloat(result[0].avgRating.toString()) : null;
}

export async function banParticipant(sessionId: string, userId: string) {
    await db
        .update(sessionParticipants)
        .set({ isBanned: true })
        .where(
            and(
                eq(sessionParticipants.sessionId, sessionId),
                eq(sessionParticipants.userId, userId)
            )
        );
}

export async function unbanParticipant(sessionId: string, userId: string) {
    await db
        .update(sessionParticipants)
        .set({ isBanned: false })
        .where(
            and(
                eq(sessionParticipants.sessionId, sessionId),
                eq(sessionParticipants.userId, userId)
            )
        );
}

export async function isParticipantBanned(sessionId: string, userId: string): Promise<boolean> {
    const participant = await db.query.sessionParticipants.findFirst({
        where: and(
            eq(sessionParticipants.sessionId, sessionId),
            eq(sessionParticipants.userId, userId)
        ),
    });
    return participant?.isBanned ?? false;
}

export async function updateParticipantSharing(
    sessionId: string,
    userId: string,
    data: {
        sharePersonalSummary?: boolean;
        shareGroupSummary?: boolean;
        shareSessionLog?: boolean;
    }
) {
    const [updated] = await db
        .update(sessionParticipants)
        .set({
            ...data,
        })
        .where(
            and(
                eq(sessionParticipants.sessionId, sessionId),
                eq(sessionParticipants.userId, userId)
            )
        )
        .returning();

    return updated;
}

export async function toggleSessionHighlight(sessionId: string, userId: string) {
    const participant = await db.query.sessionParticipants.findFirst({
        where: and(
            eq(sessionParticipants.sessionId, sessionId),
            eq(sessionParticipants.userId, userId)
        ),
    });

    if (!participant) {
        throw new Error('Participant not found');
    }

    const [updated] = await db
        .update(sessionParticipants)
        .set({
            isHighlighted: !participant.isHighlighted,
        })
        .where(
            and(
                eq(sessionParticipants.sessionId, sessionId),
                eq(sessionParticipants.userId, userId)
            )
        )
        .returning();

    return updated;
}
