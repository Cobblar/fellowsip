import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://fellowsip:fellowsip_dev@localhost:5432/fellowsip';

const transformOptions = {
    undefined: undefined,
    // Serialize Date objects to ISO strings before postgres-js processes them
    value(value: unknown) {
        if (value instanceof Date) {
            return value.toISOString();
        }
        return value;
    },
};

// Create postgres client for Lucia (and other direct usage)
// We export this one so Lucia uses a clean client instance
// IMPORTANT: Do NOT use transform here. Lucia expects Date objects for timestamps,
// and postgres.js handles Date writes natively.
export const client = postgres(connectionString);

// Create SEPARATE postgres client for Drizzle to avoid interference
// Drizzle seems to modify the client or affect its behavior with transforms
// We keep the transform here as it was in the original code, just in case Drizzle relies on it.
const drizzleClient = postgres(connectionString, {
    transform: transformOptions,
});

// Create Drizzle instance with schema
export const db = drizzle(drizzleClient, { schema });

// Export schema for use in other modules
export * from './schema.js';
