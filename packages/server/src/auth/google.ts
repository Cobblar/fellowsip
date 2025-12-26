import { Google } from 'arctic';

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';

if (!googleClientId || !googleClientSecret) {
  console.warn('Warning: Google OAuth credentials not configured');
}

export const google = new Google(
  googleClientId,
  googleClientSecret,
  googleRedirectUri
);
