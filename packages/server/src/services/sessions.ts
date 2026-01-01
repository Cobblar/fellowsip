import { db, tastingSessions, users, sessionParticipants, tastingSummaries } from '../db/index.js';
import { eq, and, desc, sql, or, exists, ne } from 'drizzle-orm';

// Re-export from sub-services
export * from './sessionBase.js';
export * from './participants.js';
export * from './summaries.js';
export * from './publicSessions.js';
export * from './comparisonSummaries.js';

// Functions that involve multiple areas or are core to session listing
export async function getUserSessions(userId: string) {
  const sessions = await db
    .select({
      session: tastingSessions,
      host: users,
      summaryId: tastingSummaries.id,
      userRating: sessionParticipants.rating,
      isHighlighted: sessionParticipants.isHighlighted,
      sharePersonalSummary: sessionParticipants.sharePersonalSummary,
      shareGroupSummary: sessionParticipants.shareGroupSummary,
      shareSessionLog: sessionParticipants.shareSessionLog,
      isArchived: sessionParticipants.isArchived,
    })
    .from(tastingSessions)
    .leftJoin(users, eq(tastingSessions.hostId, users.id))
    .leftJoin(tastingSummaries, eq(tastingSessions.id, tastingSummaries.sessionId))
    .leftJoin(sessionParticipants, and(
      eq(tastingSessions.id, sessionParticipants.sessionId),
      eq(sessionParticipants.userId, userId)
    ))
    .where(
      and(
        // Filter out sessions where user has archived them
        or(
          eq(sessionParticipants.isArchived, false),
          sql`${sessionParticipants.isArchived} IS NULL`
        ),
        or(
          eq(tastingSessions.hostId, userId),
          exists(
            db
              .select()
              .from(sessionParticipants)
              .where(
                and(
                  eq(sessionParticipants.sessionId, tastingSessions.id),
                  eq(sessionParticipants.userId, userId),
                  eq(sessionParticipants.isBanned, false)
                )
              )
          )
        )
      )
    )
    .orderBy(desc(tastingSessions.createdAt));

  return sessions;
}

export async function getActiveSessions() {
  const sessions = await db
    .select({
      session: tastingSessions,
      host: users,
      summaryId: tastingSummaries.id,
    })
    .from(tastingSessions)
    .leftJoin(users, eq(tastingSessions.hostId, users.id))
    .leftJoin(tastingSummaries, eq(tastingSessions.id, tastingSummaries.sessionId))
    .where(eq(tastingSessions.status, 'active'))
    .orderBy(desc(tastingSessions.createdAt));

  return sessions;
}

export async function endSession(sessionId: string, userId: string, shouldAnalyze: boolean = true) {
  const { getSession } = await import('./sessionBase.js');
  const session = await getSession(sessionId);

  if (!session || session.session.hostId !== userId) {
    throw new Error('Unauthorized: Only the host can end this session');
  }

  const [updated] = await db
    .update(tastingSessions)
    .set({
      status: 'ended',
      endedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(tastingSessions.id, sessionId))
    .returning();

  if (shouldAnalyze) {
    import('./ai.js').then(({ generateSessionSummary }) => {
      generateSessionSummary(sessionId).catch((err) => {
        console.error('Background summary generation failed:', err);
      });
    });
  }

  return updated;
}

export async function updateSessionDetails(
  sessionId: string,
  userId: string,
  data: {
    name?: string;
    productType?: string | null;
    productLink?: string | null;
    productName?: string | null;
    livestreamUrl?: string | null;
    customTags?: string[];
  }
) {
  const { getSession } = await import('./sessionBase.js');
  const session = await getSession(sessionId);

  if (!session || session.session.hostId !== userId) {
    throw new Error('Unauthorized: Only the host can update this session');
  }

  const [updated] = await db
    .update(tastingSessions)
    .set({
      ...data,
      updatedAt: sql`now()`,
    })
    .where(eq(tastingSessions.id, sessionId))
    .returning();

  return updated;
}

export async function addCustomTag(sessionId: string, userId: string, tag: string) {
  const { getSession } = await import('./sessionBase.js');
  const session = await getSession(sessionId);

  if (!session || session.session.hostId !== userId) {
    throw new Error('Unauthorized: Only the host can add custom tags');
  }

  const currentTags = session.session.customTags || [];
  if (currentTags.includes(tag)) {
    return session.session;
  }

  const [updated] = await db
    .update(tastingSessions)
    .set({
      customTags: [...currentTags, tag],
      updatedAt: sql`now()`,
    })
    .where(eq(tastingSessions.id, sessionId))
    .returning();

  return updated;
}

export async function cleanupInactiveSessions() {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

  const inactiveSessions = await db
    .select()
    .from(tastingSessions)
    .where(eq(tastingSessions.status, 'active'));

  const sessionsToEnd = inactiveSessions.filter(
    (s) => s.lastActivityAt && s.lastActivityAt < sixHoursAgo
  );

  const updated = [];
  for (const session of sessionsToEnd) {
    const [result] = await db
      .update(tastingSessions)
      .set({
        status: 'ended',
        endedAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(eq(tastingSessions.id, session.id))
      .returning();
    updated.push(result);
  }

  return updated;
}

export async function getParticipatedSessions(userId: string) {
  const sessions = await db
    .select({
      session: tastingSessions,
      host: users,
      summaryId: tastingSummaries.id,
      userRating: sessionParticipants.rating,
      isHighlighted: sessionParticipants.isHighlighted,
      sharePersonalSummary: sessionParticipants.sharePersonalSummary,
      shareGroupSummary: sessionParticipants.shareGroupSummary,
    })
    .from(tastingSessions)
    .leftJoin(users, eq(tastingSessions.hostId, users.id))
    .leftJoin(tastingSummaries, eq(tastingSessions.id, tastingSummaries.sessionId))
    .leftJoin(sessionParticipants, and(
      eq(tastingSessions.id, sessionParticipants.sessionId),
      eq(sessionParticipants.userId, userId)
    ))
    .where(
      and(
        ne(tastingSessions.status, 'archived'),
        or(
          eq(tastingSessions.hostId, userId),
          exists(
            db
              .select()
              .from(sessionParticipants)
              .where(
                and(
                  eq(sessionParticipants.sessionId, tastingSessions.id),
                  eq(sessionParticipants.userId, userId),
                  eq(sessionParticipants.isBanned, false)
                )
              )
          )
        )
      )
    )
    .orderBy(desc(tastingSessions.createdAt));

  return sessions;
}

export async function transferHost(sessionId: string, currentHostId: string, newHostId: string) {
  const { getSession } = await import('./sessionBase.js');
  const session = await getSession(sessionId);

  if (!session || session.session.hostId !== currentHostId) {
    throw new Error('Unauthorized: Only the current host can transfer host privileges');
  }

  if (session.session.status !== 'active') {
    throw new Error('Cannot transfer host of an ended session');
  }

  const newHost = await db.query.users.findFirst({
    where: eq(users.id, newHostId),
  });

  if (!newHost) {
    throw new Error('New host user not found');
  }

  const [updated] = await db
    .update(tastingSessions)
    .set({
      hostId: newHostId,
      updatedAt: sql`now()`,
    })
    .where(eq(tastingSessions.id, sessionId))
    .returning();

  return { session: updated, newHost };
}

export async function archiveSession(sessionId: string, userId: string) {
  // Update the participant's isArchived flag (per-user archive)
  const [updated] = await db
    .update(sessionParticipants)
    .set({
      isArchived: true,
    })
    .where(and(
      eq(sessionParticipants.sessionId, sessionId),
      eq(sessionParticipants.userId, userId)
    ))
    .returning();

  if (!updated) {
    // User might be the host but not a participant - add them as participant first
    const session = await db.query.tastingSessions.findFirst({
      where: eq(tastingSessions.id, sessionId),
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Insert a new participant record with isArchived=true
    const [inserted] = await db
      .insert(sessionParticipants)
      .values({
        sessionId,
        userId,
        isArchived: true,
      })
      .onConflictDoUpdate({
        target: [sessionParticipants.sessionId, sessionParticipants.userId],
        set: { isArchived: true },
      })
      .returning();

    return inserted;
  }

  return updated;
}

export async function unarchiveSession(sessionId: string, userId: string) {
  // Update the participant's isArchived flag (per-user unarchive)
  const [updated] = await db
    .update(sessionParticipants)
    .set({
      isArchived: false,
    })
    .where(and(
      eq(sessionParticipants.sessionId, sessionId),
      eq(sessionParticipants.userId, userId)
    ))
    .returning();

  if (!updated) {
    throw new Error('Session not found in your archive');
  }

  return updated;
}

export async function getArchivedSessions(userId: string) {
  const sessions = await db
    .select({
      session: tastingSessions,
      host: users,
      summaryId: tastingSummaries.id,
      userRating: sessionParticipants.rating,
    })
    .from(tastingSessions)
    .innerJoin(sessionParticipants, and(
      eq(tastingSessions.id, sessionParticipants.sessionId),
      eq(sessionParticipants.userId, userId),
      eq(sessionParticipants.isArchived, true)
    ))
    .leftJoin(users, eq(tastingSessions.hostId, users.id))
    .leftJoin(tastingSummaries, eq(tastingSessions.id, tastingSummaries.sessionId))
    .orderBy(desc(tastingSessions.createdAt));

  return sessions;
}
