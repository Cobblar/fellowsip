import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL || 'postgres://fellowsip:fellowsip_dev@localhost:5432/fellowsip');

async function checkColumns() {
    console.log('Checking columns...');

    const tables = ['users', 'tasting_sessions', 'tasting_summaries', 'session_participants', 'messages'];

    for (const table of tables) {
        console.log(`\nColumns for table: ${table}`);
        try {
            const columns = await sql`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = ${table}
                ORDER BY ordinal_position
            `;
            console.table(columns);
        } catch (e: any) {
            console.error(`Error checking table ${table}:`, e.message);
        }
    }

    await sql.end();
    process.exit(0);
}

checkColumns().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
