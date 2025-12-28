import { Lucia } from 'lucia';
import { PostgresJsAdapter } from '@lucia-auth/adapter-postgresql';
import { client } from '../db/index.js';
import type { DatabaseUserAttributes } from '../types/auth.js';

// Create Lucia adapter with PostgreSQL
const adapter = new PostgresJsAdapter(client, {
  user: 'users',
  session: 'sessions',
});

// Initialize Lucia
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: true,
      sameSite: 'none',
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      // Postgres returns snake_case columns
      displayName: attributes.display_name,
      avatarUrl: attributes.avatar_url,
      preferences: attributes.preferences,
    };
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}
