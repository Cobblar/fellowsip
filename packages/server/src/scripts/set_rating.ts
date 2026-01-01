import { db } from '../db/index.js';
import { tastingSessions, productRatings, users } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

async function main() {
    const session = await db.query.tastingSessions.findFirst({
        where: eq(tastingSessions.name, 'Value Grade Test'),
    });

    if (!session) {
        console.log('Session not found');
        process.exit(1);
    }

    console.log('Session ID:', session.id);

    // Update rating for Cobbler
    // We need to find the user ID first or just update all ratings for this session
    // Let's find the user ID from the ratings we saw earlier
    const ratings = await db
        .select({
            userId: productRatings.userId,
        })
        .from(productRatings)
        .where(eq(productRatings.sessionId, session.id));

    if (ratings.length === 0) {
        console.log('No ratings found to update');
        process.exit(1);
    }

    const userId = ratings[0].userId;
    console.log('Updating rating for user:', userId);

    await db.update(productRatings)
        .set({ rating: 85 })
        .where(and(
            eq(productRatings.sessionId, session.id),
            eq(productRatings.userId, userId),
            eq(productRatings.productIndex, 0)
        ));

    console.log('Updated rating to 85');
    process.exit(0);
}

main().catch(console.error);
