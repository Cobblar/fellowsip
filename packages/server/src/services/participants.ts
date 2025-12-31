import { db, sessionParticipants, productRatings } from '../db/index.js';
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

export async function updateParticipantRating(sessionId: string, userId: string, rating: number, productIndex: number = 0) {
    // Update the new productRatings table
    await db
        .insert(productRatings)
        .values({
            sessionId,
            userId,
            productIndex,
            rating,
        })
        .onConflictDoUpdate({
            target: [productRatings.sessionId, productRatings.userId, productRatings.productIndex],
            set: { rating, updatedAt: sql`now()` },
        });

    // Also update the legacy rating in sessionParticipants if it's the first product
    if (productIndex === 0) {
        await db
            .update(sessionParticipants)
            .set({ rating })
            .where(
                and(
                    eq(sessionParticipants.sessionId, sessionId),
                    eq(sessionParticipants.userId, userId)
                )
            );
    }
}

export async function getAverageRating(sessionId: string, productIndex: number = 0): Promise<number | null> {
    const result = await db
        .select({
            avgRating: sql<number>`avg(${productRatings.rating})`,
        })
        .from(productRatings)
        .where(
            and(
                eq(productRatings.sessionId, sessionId),
                eq(productRatings.productIndex, productIndex)
            )
        );

    return result[0]?.avgRating ? parseFloat(result[0].avgRating.toString()) : null;
}

export async function getAverageRatings(sessionId: string): Promise<Record<number, number | null>> {
    const results = await db
        .select({
            productIndex: productRatings.productIndex,
            avgRating: sql<number>`avg(${productRatings.rating})`,
        })
        .from(productRatings)
        .where(eq(productRatings.sessionId, sessionId))
        .groupBy(productRatings.productIndex);

    const ratings: Record<number, number | null> = {};
    results.forEach(r => {
        ratings[r.productIndex] = r.avgRating ? parseFloat(r.avgRating.toString()) : null;
    });
    return ratings;
}

export async function getUserProductRatings(sessionId: string, userId: string): Promise<Record<number, number | null>> {
    const results = await db
        .select({
            productIndex: productRatings.productIndex,
            rating: productRatings.rating,
        })
        .from(productRatings)
        .where(
            and(
                eq(productRatings.sessionId, sessionId),
                eq(productRatings.userId, userId)
            )
        );

    const ratings: Record<number, number | null> = {};
    results.forEach(r => {
        ratings[r.productIndex] = r.rating;
    });
    return ratings;
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
