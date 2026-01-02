import { db, users } from './src/db/index.js';
import { eq } from 'drizzle-orm';

async function checkUser() {
    const allUsers = await db.select().from(users);
    console.log(JSON.stringify(allUsers, null, 2));
    process.exit(0);
}

checkUser();
