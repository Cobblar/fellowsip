import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL || 'postgres://fellowsip:fellowsip_dev@localhost:5432/fellowsip');

async function checkData() {
    console.log('Checking data counts...');

    const tables = ['users', 'tasting_sessions', 'tasting_summaries', 'session_participants', 'messages'];

    for (const table of tables) {
        try {
            const [result] = await sql`SELECT count(*) FROM ${sql(table)}`;
            console.log(`${table}: ${result.count} rows`);
        } catch (e: any) {
            console.error(`Error checking table ${table}:`, e.message);
        }
    }

    await sql.end();
    process.exit(0);
}

checkData().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
