#!/usr/bin/env tsx
import postgres from 'postgres';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://fellowsip:fellowsip_dev@localhost:5432/fellowsip';

async function bootstrapMigrations() {
    console.log('🔄 Bootstrapping migration system...');
    console.log(`📍 Database: ${DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);

    const sql = postgres(DATABASE_URL, { max: 1 });

    try {
        // Create drizzle schema and migrations table if they don't exist
        await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS drizzle`);
        console.log('✓ Created drizzle schema');

        await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);
        console.log('✓ Created migrations tracking table');

        // Get list of migration files
        const migrationsDir = path.join(process.cwd(), 'packages/server/drizzle');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        console.log(`📁 Found ${files.length} migration files`);

        // Check which migrations are already applied
        const applied = await sql`SELECT hash FROM drizzle.__drizzle_migrations`;
        const appliedHashes = new Set(applied.map(r => r.hash));

        // Apply each migration
        for (const file of files) {
            const hash = file.replace('.sql', '');

            if (appliedHashes.has(hash)) {
                console.log(`⏭️  Already applied: ${file}`);
                continue;
            }

            console.log(`🔄 Applying migration: ${file}`);

            // Read the SQL file
            const sqlFilePath = path.join(migrationsDir, file);
            const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

            // Split by statement breakpoint and execute each statement
            const statements = sqlContent
                .split('-->statement-breakpoint')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            // Execute each statement
            for (const statement of statements) {
                try {
                    await sql.unsafe(statement);
                } catch (error: any) {
                    // If it's a "already exists" error, that's okay - continue
                    if (error.code === '42P07' || error.code === '42701' || error.code === '42P06') {
                        console.log(`  ⚠️  Skipping (already exists): ${statement.substring(0, 50)}...`);
                    } else {
                        throw error;
                    }
                }
            }

            // Mark as applied
            await sql`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES (${hash}, ${Date.now()})
      `;
            console.log(`✅ Applied: ${file}`);
        }

        console.log('✨ All migrations applied successfully!');
    } catch (error) {
        console.error('❌ Bootstrap failed:', error);
        throw error;
    } finally {
        await sql.end();
    }
}

bootstrapMigrations()
    .then(() => {
        console.log('✅ Migration system bootstrapped!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('💥 Fatal error:', err);
        process.exit(1);
    });
