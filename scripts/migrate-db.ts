#!/usr/bin/env tsx
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://fellowsip:fellowsip_dev@localhost:5432/fellowsip';

async function runMigrations() {
    console.log('🔄 Running database migrations...');
    console.log(`📍 Database: ${DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);

    const migrationClient = postgres(DATABASE_URL, { max: 1 });
    const db = drizzle(migrationClient);

    try {
        await migrate(db, { migrationsFolder: './packages/server/drizzle' });
        console.log('✅ Migrations completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await migrationClient.end();
    }
}

runMigrations()
    .then(() => {
        console.log('✨ Database is up to date!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('💥 Fatal error:', err);
        process.exit(1);
    });
