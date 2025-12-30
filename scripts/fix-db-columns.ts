import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/fellowsip');

async function addMissingColumns() {
    console.log('Adding missing columns...');

    try {
        await sql.unsafe('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false NOT NULL');
        console.log('✓ Added is_public to users');
    } catch (e) {
        console.log('is_public already exists or error:', e.message);
    }

    try {
        await sql.unsafe('ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT');
        console.log('✓ Added bio to users');
    } catch (e) {
        console.log('bio already exists or error:', e.message);
    }

    try {
        await sql.unsafe('ALTER TABLE session_participants ADD COLUMN IF NOT EXISTS share_personal_summary BOOLEAN DEFAULT false NOT NULL');
        console.log('✓ Added share_personal_summary to session_participants');
    } catch (e) {
        console.log('share_personal_summary already exists or error:', e.message);
    }

    try {
        await sql.unsafe('ALTER TABLE session_participants ADD COLUMN IF NOT EXISTS share_group_summary BOOLEAN DEFAULT false NOT NULL');
        console.log('✓ Added share_group_summary to session_participants');
    } catch (e) {
        console.log('share_group_summary already exists or error:', e.message);
    }

    try {
        await sql.unsafe('ALTER TABLE session_participants ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN DEFAULT false NOT NULL');
        console.log('✓ Added is_highlighted to session_participants');
    } catch (e) {
        console.log('is_highlighted already exists or error:', e.message);
    }

    console.log('Done!');
    await sql.end();
    process.exit(0);
}

addMissingColumns().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
