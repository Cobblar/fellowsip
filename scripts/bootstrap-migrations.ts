#!/usr/bin/env tsx
import postgres from 'postgres';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://fellowsip:fellowsip_dev@localhost:5432/fellowsip';

async function markMigrationsAsApplied() {
    console.log('🔄 Marking existing migrations as applied...');
    console.log(`📍 Database: ${DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);

    const sql = postgres(DATABASE_URL, { max: 1 });

    try {
        // Create drizzle schema and migrations table if they don't exist
        await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS drizzle`);
        await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

        // Get list of migration files
        const migrationsDir = path.join(process.cwd(), 'packages/server/drizzle');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        console.log(`📁 Found ${files.length} migration files`);

        // Check which migrations are already applied
        const applied = await sql`SELECT hash FROM drizzle.__drizzle_migrations`;
        const appliedHashes = new Set(applied.map(r => r.hash));

        // Mark all migrations as applied
        for (const file of files) {
            const hash = file.replace('.sql', '');

            if (appliedHashes.has(hash)) {
                console.log(`⏭️  Already applied: ${file}`);
            } else {
                await sql`
          INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
          VALUES (${hash}, ${Date.now()})
        `;
                console.log(`✅ Marked as applied: ${file}`);
            }
        }

        console.log('✨ All existing migrations marked as applied!');
    } catch (error) {
        console.error('❌ Failed to mark migrations:', error);
        throw error;
    } finally {
        await sql.end();
    }
}

markMigrationsAsApplied()
    .then(() => {
        console.log('✅ Migration history synchronized!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('💥 Fatal error:', err);
        process.exit(1);
    });
