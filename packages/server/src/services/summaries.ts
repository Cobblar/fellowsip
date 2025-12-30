import { db, tastingSummaries, sessionParticipants, users, tastingSessions } from '../db/index.js';
import { eq, and, desc, or, exists, ne, sql } from 'drizzle-orm';
import { getSession } from './sessionBase.js';

export async function getSessionSummary(sessionId: string) {
    const summary = await db.query.tastingSummaries.findFirst({
        where: eq(tastingSummaries.sessionId, sessionId),
    });

    if (!summary) return null;

    const allParticipants = await db
        .select({
            userId: sessionParticipants.userId,
            rating: sessionParticipants.rating,
            sharePersonalSummary: sessionParticipants.sharePersonalSummary,
            shareGroupSummary: sessionParticipants.shareGroupSummary,
            shareSessionLog: sessionParticipants.shareSessionLog,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
        })
        .from(sessionParticipants)
        .leftJoin(users, eq(sessionParticipants.userId, users.id))
        .where(eq(sessionParticipants.sessionId, sessionId));

    const participants = allParticipants.reduce((acc: any[], current) => {
        const x = acc.find(item => item.userId === current.userId);
        if (!x) {
            return acc.concat([current]);
        } else {
            return acc;
        }
    }, []);

    return {
        ...summary,
        participants,
    };
}

export async function getAllUserSummaries(userId: string) {
    const summaries = await db
        .select({
            summary: tastingSummaries,
            session: tastingSessions,
        })
        .from(tastingSummaries)
        .innerJoin(tastingSessions, eq(tastingSummaries.sessionId, tastingSessions.id))
        .where(
            and(
                ne(tastingSessions.status, 'archived'),
                or(
                    eq(tastingSessions.hostId, userId),
                    exists(
                        db
                            .select()
                            .from(sessionParticipants)
                            .where(
                                and(
                                    eq(sessionParticipants.sessionId, tastingSessions.id),
                                    eq(sessionParticipants.userId, userId),
                                    eq(sessionParticipants.isBanned, false)
                                )
                            )
                    )
                )
            )
        )
        .orderBy(desc(tastingSummaries.createdAt));

    const summariesWithParticipants = await Promise.all(
        summaries.map(async (s) => {
            const participants = await db
                .select({
                    userId: sessionParticipants.userId,
                    displayName: users.displayName,
                    avatarUrl: users.avatarUrl,
                    sharePersonalSummary: sessionParticipants.sharePersonalSummary,
                    shareGroupSummary: sessionParticipants.shareGroupSummary,
                    shareSessionLog: sessionParticipants.shareSessionLog,
                    isHighlighted: sessionParticipants.isHighlighted,
                })
                .from(sessionParticipants)
                .leftJoin(users, eq(sessionParticipants.userId, users.id))
                .where(eq(sessionParticipants.sessionId, s.session.id));

            return {
                ...s,
                summary: {
                    ...s.summary,
                    participants,
                },
            };
        })
    );

    return summariesWithParticipants;
}

export async function updateSessionSummary(
    sessionId: string,
    data: {
        nose?: string;
        palate?: string;
        finish?: string;
        observations?: string;
        rating?: number;
    }
) {
    const existing = await getSessionSummary(sessionId);
    if (!existing) {
        throw new Error('Summary not found');
    }

    const metadata = {
        ...(existing.metadata as any),
    };

    if (data.rating !== undefined) {
        metadata.rating = data.rating;
    }

    const [updated] = await db
        .update(tastingSummaries)
        .set({
            nose: data.nose ?? existing.nose,
            palate: data.palate ?? existing.palate,
            finish: data.finish ?? existing.finish,
            observations: data.observations ?? existing.observations,
            metadata,
        })
        .where(eq(tastingSummaries.sessionId, sessionId))
        .returning();

    return updated;
}

export async function getPublicSummary(sessionId: string) {
    const summary = await db.query.tastingSummaries.findFirst({
        where: eq(tastingSummaries.sessionId, sessionId),
    });

    if (!summary) return null;

    const session = await getSession(sessionId);
    if (!session) return null;

    const allParticipants = await db
        .select({
            userId: sessionParticipants.userId,
            rating: sessionParticipants.rating,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
            sharePersonalSummary: sessionParticipants.sharePersonalSummary,
            shareGroupSummary: sessionParticipants.shareGroupSummary,
            shareSessionLog: sessionParticipants.shareSessionLog,
            isHighlighted: sessionParticipants.isHighlighted,
        })
        .from(sessionParticipants)
        .leftJoin(users, eq(sessionParticipants.userId, users.id))
        .where(eq(sessionParticipants.sessionId, sessionId));

    const hasAnySharer = allParticipants.some(
        (p) => p.sharePersonalSummary || p.shareGroupSummary
    );

    if (!hasAnySharer) return null;

    const hasGroupSharer = allParticipants.some((p) => p.shareGroupSummary);

    const sharedTasterSummaries = summary.tasterSummaries?.filter((ts) =>
        allParticipants.some((p) => p.userId === ts.userId && p.sharePersonalSummary === true)
    ) || [];

    const sharedParticipants = allParticipants.filter(
        (p) => p.sharePersonalSummary || p.shareGroupSummary
    );

    const publicSummary = hasGroupSharer ? {
        ...summary,
        tasterSummaries: sharedTasterSummaries,
    } : {
        ...summary,
        nose: null,
        palate: null,
        finish: null,
        observations: null,
        tasterSummaries: sharedTasterSummaries,
    };

    const sessionLogAvailable = allParticipants.length > 0 && allParticipants.every(p => p.shareSessionLog);

    return {
        ...publicSummary,
        participants: sharedParticipants,
        sessionLogAvailable,
        session: {
            ...session.session,
            host: session.host,
        },
    };
}

export async function getPublicUserSummaries(userId: string) {
    const sharedSessions = await db
        .select({
            sessionId: sessionParticipants.sessionId,
        })
        .from(sessionParticipants)
        .where(
            and(
                eq(sessionParticipants.userId, userId),
                or(
                    eq(sessionParticipants.sharePersonalSummary, true),
                    eq(sessionParticipants.shareGroupSummary, true)
                )
            )
        );

    if (sharedSessions.length === 0) return [];

    const sessionIds = sharedSessions.map((s) => s.sessionId);

    const summaries = await db
        .select({
            summary: tastingSummaries,
            session: tastingSessions,
            host: users,
            isHighlighted: sessionParticipants.isHighlighted,
        })
        .from(tastingSummaries)
        .innerJoin(tastingSessions, eq(tastingSummaries.sessionId, tastingSessions.id))
        .leftJoin(users, eq(tastingSessions.hostId, users.id))
        .leftJoin(sessionParticipants, and(
            eq(tastingSessions.id, sessionParticipants.sessionId),
            eq(sessionParticipants.userId, userId)
        ))
        .where(
            and(
                ne(tastingSessions.status, 'archived'),
                sql`${tastingSessions.id} IN (${sql.join(sessionIds, sql`, `)})`
            )
        )
        .orderBy(desc(tastingSummaries.createdAt));

    return summaries;
}
