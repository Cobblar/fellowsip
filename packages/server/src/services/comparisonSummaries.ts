import { db, comparisonSummaries } from '../db/index.js';
import { eq } from 'drizzle-orm';

export async function getComparisonSummary(sessionId: string) {
    return await db.query.comparisonSummaries.findFirst({
        where: eq(comparisonSummaries.sessionId, sessionId),
    });
}

export async function saveComparisonSummary(sessionId: string, data: {
    comparativeNotes: string;
    rankings?: Array<{
        productIndex: number;
        rank: number;
        notes: string;
    }>;
    metadata?: any;
}) {
    const [saved] = await db
        .insert(comparisonSummaries)
        .values({
            sessionId,
            comparativeNotes: data.comparativeNotes,
            rankings: data.rankings,
            metadata: data.metadata,
        })
        .onConflictDoUpdate({
            target: comparisonSummaries.sessionId,
            set: {
                comparativeNotes: data.comparativeNotes,
                rankings: data.rankings,
                metadata: data.metadata,
                generatedAt: new Date(),
            },
        })
        .returning();

    return saved;
}
