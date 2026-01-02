import { Lucia } from 'lucia';
import { PostgresJsAdapter } from '@lucia-auth/adapter-postgresql';
import { client } from '../db/index.js';
// Lucia user attributes (what gets stored in the session)
export interface DatabaseUserAttributes {
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  preferences: any;
  bio: string | null;
  use_generated_avatar: boolean;
}

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
      bio: attributes.bio,
      useGeneratedAvatar: attributes.use_generated_avatar,
    };
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}
