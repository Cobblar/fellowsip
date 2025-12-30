import type { User, Session } from '../db/schema.js';

// Lucia user attributes (what gets stored in the session)
export interface DatabaseUserAttributes {
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  preferences: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
    recentTags?: string[];
    [key: string]: any;
  } | null;
  bio: string | null;
}

export type { User, Session };
