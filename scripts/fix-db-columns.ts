import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/fellowsip');

async function addMissingColumns() {
    console.log('Adding missing columns...');

    try {
        await sql.unsafe('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false NOT NULL');
        console.log('✓ Added is_public to users');
    } catch (e: any) {
        console.log('is_public already exists or error:', e.message);
    }

    try {
        await sql.unsafe('ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT');
        console.log('✓ Added bio to users');
    } catch (e: any) {
        console.log('bio already exists or error:', e.message);
    }

    try {
        await sql.unsafe('ALTER TABLE session_participants ADD COLUMN IF NOT EXISTS share_personal_summary BOOLEAN DEFAULT false NOT NULL');
        console.log('✓ Added share_personal_summary to session_participants');
    } catch (e: any) {
        console.log('share_personal_summary already exists or error:', e.message);
    }

    try {
        await sql.unsafe('ALTER TABLE session_participants ADD COLUMN IF NOT EXISTS share_group_summary BOOLEAN DEFAULT false NOT NULL');
        console.log('✓ Added share_group_summary to session_participants');
    } catch (e: any) {
        console.log('share_group_summary already exists or error:', e.message);
    }

    try {
        await sql.unsafe('ALTER TABLE session_participants ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN DEFAULT false NOT NULL');
        console.log('✓ Added is_highlighted to session_participants');
    } catch (e: any) {
        console.log('is_highlighted already exists or error:', e.message);
    }

    try {
        await sql.unsafe('ALTER TABLE session_participants ADD COLUMN IF NOT EXISTS share_session_log BOOLEAN DEFAULT false NOT NULL');
        console.log('✓ Added share_session_log to session_participants');
    } catch (e: any) {
        console.log('share_session_log already exists or error:', e.message);
    }

    try {
        await sql.unsafe('ALTER TABLE session_participants ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL');
        console.log('✓ Added is_archived to session_participants');
    } catch (e: any) {
        console.log('is_archived already exists or error:', e.message);
    }

    try {
        await sql.unsafe('ALTER TABLE tasting_sessions ADD COLUMN IF NOT EXISTS products JSONB DEFAULT \'[]\'::jsonb NOT NULL');
        console.log('✓ Added products to tasting_sessions');
    } catch (e: any) {
        console.log('products already exists or error:', e.message);
    }

    try {
        await sql.unsafe('ALTER TABLE tasting_sessions ADD COLUMN IF NOT EXISTS is_solo BOOLEAN DEFAULT false NOT NULL');
        console.log('✓ Added is_solo to tasting_sessions');
    } catch (e: any) {
        console.log('is_solo already exists or error:', e.message);
    }

    try {
        await sql.unsafe('ALTER TABLE tasting_summaries ADD COLUMN IF NOT EXISTS product_index INTEGER DEFAULT 0 NOT NULL');
        console.log('✓ Added product_index to tasting_summaries');
    } catch (e: any) {
        console.log('product_index already exists or error:', e.message);
    }

    try {
        await sql.unsafe('ALTER TABLE messages ADD COLUMN IF NOT EXISTS product_index INTEGER DEFAULT 0 NOT NULL');
        console.log('✓ Added product_index to messages');
    } catch (e: any) {
        console.log('product_index already exists or error:', e.message);
    }

    try {
        await sql.unsafe('ALTER TABLE messages ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT \'{}\' NOT NULL');
        console.log('✓ Added tags to messages');
    } catch (e: any) {
        console.log('tags already exists or error:', e.message);
    }

    // Create product_ratings table if it doesn't exist
    try {
        await sql.unsafe(`
            CREATE TABLE IF NOT EXISTS product_ratings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id UUID NOT NULL REFERENCES tasting_sessions(id) ON DELETE CASCADE,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                product_index INTEGER DEFAULT 0 NOT NULL,
                rating REAL,
                value_grade TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                UNIQUE(session_id, user_id, product_index)
            )
        `);
        console.log('✓ Created product_ratings table');
    } catch (e: any) {
        console.log('product_ratings table error:', e.message);
    }

    // Create comparison_summaries table if it doesn't exist
    try {
        await sql.unsafe(`
            CREATE TABLE IF NOT EXISTS comparison_summaries (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id UUID NOT NULL UNIQUE REFERENCES tasting_sessions(id) ON DELETE CASCADE,
                comparative_notes TEXT,
                rankings JSONB,
                metadata JSONB,
                generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            )
        `);
        console.log('✓ Created comparison_summaries table');
    } catch (e: any) {
        console.log('comparison_summaries table error:', e.message);
    }

    // Create unique indexes required for ON CONFLICT operations
    try {
        await sql.unsafe('CREATE UNIQUE INDEX IF NOT EXISTS unique_session_product_idx ON tasting_summaries(session_id, product_index)');
        console.log('✓ Created unique_session_product_idx on tasting_summaries');
    } catch (e: any) {
        console.log('unique_session_product_idx error:', e.message);
    }

    try {
        await sql.unsafe('CREATE UNIQUE INDEX IF NOT EXISTS unique_session_participant_idx ON session_participants(session_id, user_id)');
        console.log('✓ Created unique_session_participant_idx on session_participants');
    } catch (e: any) {
        console.log('unique_session_participant_idx error:', e.message);
    }

    try {
        await sql.unsafe('CREATE UNIQUE INDEX IF NOT EXISTS unique_user_product_rating_idx ON product_ratings(session_id, user_id, product_index)');
        console.log('✓ Created unique_user_product_rating_idx on product_ratings');
    } catch (e: any) {
        console.log('unique_user_product_rating_idx error:', e.message);
    }

    console.log('Done!');
    await sql.end();
    process.exit(0);
}

addMissingColumns().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
