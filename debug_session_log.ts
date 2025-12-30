import { db, sessionParticipants } from './packages/server/src/db/index.js';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function checkSessionLog() {
    console.log('Checking session participants...');
    const participants = await db.select().from(sessionParticipants);

    console.log(`Found ${participants.length} participants.`);

    const shared = participants.filter(p => p.shareSessionLog);
    console.log(`Found ${shared.length} participants with shareSessionLog = true.`);

    if (shared.length > 0) {
        console.log('Sample shared participant:', shared[0]);
    } else {
        console.log('No participants have shared session log.');
    }

    process.exit(0);
}

checkSessionLog().catch(console.error);
