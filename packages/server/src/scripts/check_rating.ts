import { db } from '../db/index.js';
import { tastingSessions, productRatings, tastingSummaries } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
    const session = await db.query.tastingSessions.findFirst({
        where: eq(tastingSessions.name, 'Value Grade Test'),
    });

    if (!session) {
        console.log('Session not found');
        process.exit(1);
    }

    console.log('Session ID:', session.id);

    const ratings = await db
        .select({
            userId: productRatings.userId,
            valueGrade: productRatings.valueGrade,
            rating: productRatings.rating,
            productIndex: productRatings.productIndex,
        })
        .from(productRatings)
        .where(eq(productRatings.sessionId, session.id));

    console.log('Ratings:', JSON.stringify(ratings, null, 2));

    const summaries = await db
        .select({
            productIndex: tastingSummaries.productIndex,
        })
        .from(tastingSummaries)
        .where(eq(tastingSummaries.sessionId, session.id));

    console.log('Summaries:', JSON.stringify(summaries, null, 2));
    process.exit(0);
}

main().catch(console.error);
