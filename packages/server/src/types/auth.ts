import type { User, Session } from '../db/schema.js';

// Lucia user attributes (what gets stored in the session)
export interface DatabaseUserAttributes {
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

export type { User, Session };
