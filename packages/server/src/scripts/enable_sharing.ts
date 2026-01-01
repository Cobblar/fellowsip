import { db } from '../db/index.js';
import { sessionParticipants, tastingSessions } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

async function main() {
    const session = await db.query.tastingSessions.findFirst({
        where: eq(tastingSessions.name, 'Value Grade Test'),
    });

    if (!session) {
        console.log('Session not found');
        process.exit(1);
    }

    console.log('Found session:', session.id);

    // Update for the specific user (Cobbler) - assuming we want to update all participants for this session for simplicity in testing
    // or just find the one that matches the user ID if we knew it.
    // Let's update all participants in this session to share personal summary.

    await db.update(sessionParticipants)
        .set({ sharePersonalSummary: true })
        .where(eq(sessionParticipants.sessionId, session.id));

    console.log('Updated sharing settings');
    process.exit(0);
}

main().catch(console.error);
