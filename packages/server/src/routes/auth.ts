import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { generateState, generateCodeVerifier } from 'arctic';
import { requireAuth } from '../middleware/auth.js';
import { getParticipatedSessions, getPublicUserSummaries } from '../services/sessions.js';
import { google } from '../auth/google.js';
import { lucia } from '../auth/lucia.js';
import { db, users, oauthAccounts } from '../db/index.js';
import { eq, and } from 'drizzle-orm';

interface GoogleUser {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export async function authRoutes(fastify: FastifyInstance) {
  // Initiate Google OAuth flow
  fastify.get('/auth/google', async (_request: FastifyRequest, reply: FastifyReply) => {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);
    url.searchParams.set('prompt', 'select_account');

    // Store state and code verifier in cookies for validation
    reply
      .setCookie('google_oauth_state', state, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 10, // 10 minutes
        sameSite: 'lax',
      })
      .setCookie('google_code_verifier', codeVerifier, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 10, // 10 minutes
        sameSite: 'lax',
      })
      .redirect(url.toString());
  });

  // Handle Google OAuth callback
  fastify.get('/auth/google/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    const { code, state } = request.query as { code?: string; state?: string };
    const storedState = request.cookies.google_oauth_state;
    const codeVerifier = request.cookies.google_code_verifier;

    console.log('[OAuth] Callback received:', { hasCode: !!code, hasState: !!state });

    // Validate state parameter
    if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
      console.error('[OAuth] Invalid state:', { code: !!code, state: !!state, storedState: !!storedState, codeVerifier: !!codeVerifier, stateMatch: state === storedState });
      return reply.status(400).send({ error: 'Invalid OAuth state' });
    }

    try {
      console.log('[OAuth] Exchanging code for tokens...');
      // Exchange code for tokens
      const tokens = await google.validateAuthorizationCode(code, codeVerifier);
      console.log('[OAuth] Tokens received successfully');

      // Fetch user info from Google
      console.log('[OAuth] Fetching user info from Google...');
      const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
        },
      });

      const googleUser = await response.json() as GoogleUser;
      console.log('[OAuth] Google user info:', { sub: googleUser.sub, email: googleUser.email, name: googleUser.name });

      // First, check if this OAuth account already exists
      console.log('[OAuth] Checking for existing OAuth account...');
      const [existingOAuthAccount] = await db
        .select()
        .from(oauthAccounts)
        .where(and(
          eq(oauthAccounts.providerId, 'google'),
          eq(oauthAccounts.providerUserId, googleUser.sub)
        ));

      let userId: string;

      if (existingOAuthAccount) {
        // OAuth account exists, use the linked user
        console.log('[OAuth] Found existing OAuth account, user ID:', existingOAuthAccount.userId);
        userId = existingOAuthAccount.userId;
      } else {
        // OAuth account doesn't exist, check if user exists by email
        console.log('[OAuth] No OAuth account found, checking for existing user by email...');
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, googleUser.email));

        if (existingUser) {
          // User exists but no OAuth account - link the OAuth account
          console.log('[OAuth] Found existing user, linking OAuth account...');
          userId = existingUser.id;

          await db.insert(oauthAccounts).values({
            providerId: 'google',
            providerUserId: googleUser.sub,
            userId: userId,
          });
          console.log('[OAuth] OAuth account linked successfully');
        } else {
          // Neither user nor OAuth account exists - create both
          console.log('[OAuth] Creating new user and OAuth account...');
          const [newUser] = await db
            .insert(users)
            .values({
              id: googleUser.sub,
              email: googleUser.email,
              displayName: googleUser.name || null,
              avatarUrl: googleUser.picture || null,
            })
            .returning();

          userId = newUser.id;
          console.log('[OAuth] New user created:', userId);

          await db.insert(oauthAccounts).values({
            providerId: 'google',
            providerUserId: googleUser.sub,
            userId: userId,
          });
          console.log('[OAuth] OAuth account created');
        }
      }

      // Create session with Lucia
      console.log('[OAuth] Creating session for user:', userId);
      const session = await lucia.createSession(userId, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      console.log('[OAuth] Session created:', session.id);

      // Clear OAuth cookies and set session cookie
      console.log('[OAuth] Setting session cookie and redirecting...');
      reply
        .clearCookie('google_oauth_state')
        .clearCookie('google_code_verifier')
        .setCookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
        .redirect(process.env.APP_URL || 'http://localhost:5173');
    } catch (error) {
      console.error('[OAuth] Error during callback:', error);
      console.error('[OAuth] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('[OAuth] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
      });
      return reply.status(500).send({ error: 'Authentication failed' });
    }
  });

  // Get current session
  fastify.get('/auth/session', async (request: FastifyRequest, reply: FastifyReply) => {
    const sessionId = request.cookies[lucia.sessionCookieName];
    console.log('[DEBUG] /auth/session hit');
    console.log('[DEBUG] Cookies received:', request.cookies);
    console.log('[DEBUG] Session ID from cookie:', sessionId);

    if (!sessionId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    try {
      const { session, user } = await lucia.validateSession(sessionId);

      if (!session) {
        return reply.status(401).send({ error: 'Invalid session' });
      }

      return reply.send({
        user: {
          id: user.id,
          email: (user as any).email,
          displayName: (user as any).displayName,
          avatarUrl: (user as any).avatarUrl,
          bio: (user as any).bio,
        },
      });
    } catch (error) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Logout
  fastify.post('/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    const sessionId = request.cookies[lucia.sessionCookieName];

    if (!sessionId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    try {
      await lucia.invalidateSession(sessionId);
      const blankCookie = lucia.createBlankSessionCookie();

      return reply
        .setCookie(blankCookie.name, blankCookie.value, blankCookie.attributes)
        .send({ success: true });
    } catch (error) {
      return reply.status(500).send({ error: 'Logout failed' });
    }
  });
  // Update user profile
  fastify.patch('/auth/profile', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { displayName, avatarUrl, bio } = request.body as {
        displayName?: string;
        avatarUrl?: string;
        bio?: string;
      };

      const updateData: any = {};
      if (displayName !== undefined) updateData.displayName = displayName.trim();
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
      if (bio !== undefined) updateData.bio = bio.trim();

      if (Object.keys(updateData).length === 0) {
        return reply.status(400).send({ error: 'No data to update' });
      }

      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, user.id))
        .returning();

      return reply.send({ user: updatedUser });
    } catch (error) {
      console.error('Update profile error:', error);
      return reply.status(500).send({ error: 'Failed to update profile' });
    }
  });

  // Get user's participated sessions
  fastify.get('/auth/profile/sessions', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const sessions = await getParticipatedSessions(user.id);

      return reply.send({
        sessions: sessions.map((s) => ({
          ...s.session,
          host: s.host,
          summaryId: s.summaryId,
          userRating: s.userRating,
          isHighlighted: s.isHighlighted,
          sharePersonalSummary: s.sharePersonalSummary,
          shareGroupSummary: s.shareGroupSummary,
        })),
      });
    } catch (error) {
      console.error('Get profile sessions error:', error);
      return reply.status(500).send({ error: 'Failed to get profile sessions' });
    }
  });

  // Update user preferences
  fastify.patch('/auth/preferences', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { preferences } = request.body as { preferences: any };

      if (!preferences || typeof preferences !== 'object') {
        return reply.status(400).send({ error: 'Preferences object is required' });
      }

      // Fetch current preferences to merge
      const [currentUser] = await db
        .select({ preferences: users.preferences })
        .from(users)
        .where(eq(users.id, user.id));

      const updatedPreferences = {
        ...(currentUser?.preferences || {}),
        ...preferences,
      };

      const [updatedUser] = await db
        .update(users)
        .set({ preferences: updatedPreferences })
        .where(eq(users.id, user.id))
        .returning();

      return reply.send({ user: updatedUser });
    } catch (error) {
      console.error('Update preferences error:', error);
      return reply.status(500).send({ error: 'Failed to update preferences' });
    }
  });

  // Get public user profile and their shared summaries
  fastify.get('/users/:id/public', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      // Fetch user info
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Fetch shared summaries
      const summaries = await getPublicUserSummaries(id);

      return reply.send({
        user: {
          id: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
        },
        summaries: summaries.map((s) => ({
          ...s.summary,
          session: {
            ...s.session,
            isHighlighted: s.isHighlighted,
          },
          host: s.host,
          valueGrade: s.valueGrade,
          rating: s.rating,
        })),

      });
    } catch (error) {
      console.error('Get public profile error:', error);
      return reply.status(500).send({ error: 'Failed to get public profile' });
    }
  });
}
