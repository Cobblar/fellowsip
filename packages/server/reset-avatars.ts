import { db } from './src/db';
import { users } from './src/db/schema';

async function main() {
    console.log('Updating all users to useGeneratedAvatar = false...');
    const result = await db.update(users).set({ useGeneratedAvatar: false });
    console.log('Done!');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
