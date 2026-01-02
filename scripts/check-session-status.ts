import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL || 'postgres://fellowsip:fellowsip_dev@localhost:5432/fellowsip');

async function checkSessionStatus() {
    console.log('Checking session statuses...');

    try {
        const results = await sql`
            SELECT status, count(*) 
            FROM tasting_sessions 
            GROUP BY status
        `;
        console.table(results);
    } catch (e: any) {
        console.error(`Error checking session statuses:`, e.message);
    }

    await sql.end();
    process.exit(0);
}

checkSessionStatus().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
