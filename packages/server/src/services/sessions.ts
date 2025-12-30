import { db, tastingSessions, users, tastingSummaries, sessionParticipants } from '../db/index.js';
import { eq, and, desc, sql, or, exists, ne } from 'drizzle-orm';

export async function createSession(
  hostId: string,
  name: string,
  productType: string | null = null,
  productLink: string | null = null,
  productName: string | null = null,
  livestreamUrl: string | null = null,
  customTags: string[] = []
) {
  const [session] = await db
    .insert(tastingSessions)
    .values({
      name,
      productType,
      productLink,
      productName,
      livestreamUrl,
      customTags,
      hostId,
      status: 'active',
    })
    .returning();

  // Add host as a participant
  await addSessionParticipant(session.id, hostId);

  return session;
}

export async function getSession(sessionId: string) {
  const [session] = await db
    .select({
      session: tastingSessions,
      host: users,
    })
    .from(tastingSessions)
    .leftJoin(users, eq(tastingSessions.hostId, users.id))
    .where(eq(tastingSessions.id, sessionId));

  return session;
}

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
                  eq(sessionParticipants.isBanned, false) // Filter out banned
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
  const session = await getSession(sessionId);

  if (!session || session.session.hostId !== userId) {
    console.error('End session failed:', {
      sessionId,
      userId,
      sessionHostId: session?.session.hostId,
      isMatch: session?.session.hostId === userId
    });
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

  // Trigger AI summary generation asynchronously if requested
  if (shouldAnalyze) {
    // We don't await this because we want to return the response quickly
    // and let the AI process in the background.
    import('./ai.js').then(({ generateSessionSummary }) => {
      generateSessionSummary(sessionId).catch((err) => {
        console.error('Background summary generation failed:', err);
      });
    });
  }

  return updated;
}

export async function updateSessionActivity(sessionId: string) {
  await db
    .update(tastingSessions)
    .set({
      lastActivityAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(tastingSessions.id, sessionId));
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

  // Find inactive sessions
  const inactiveSessions = await db
    .select()
    .from(tastingSessions)
    .where(eq(tastingSessions.status, 'active'));

  // Filter in JavaScript for simplicity
  const sessionsToEnd = inactiveSessions.filter(
    (s) => s.lastActivityAt && s.lastActivityAt < sixHoursAgo
  );

  // Update each session
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

export async function getSessionSummary(sessionId: string) {
  const summary = await db.query.tastingSummaries.findFirst({
    where: eq(tastingSummaries.sessionId, sessionId),
  });

  if (!summary) return null;

  // Fetch all participants with their ratings and deduplicate by userId
  const allParticipants = await db
    .select({
      userId: sessionParticipants.userId,
      rating: sessionParticipants.rating,
      sharePersonalSummary: sessionParticipants.sharePersonalSummary,
      shareGroupSummary: sessionParticipants.shareGroupSummary,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(sessionParticipants)
    .leftJoin(users, eq(sessionParticipants.userId, users.id))
    .where(eq(sessionParticipants.sessionId, sessionId));

  // Deduplicate by userId (defensive)
  const participants = allParticipants.reduce((acc: any[], current) => {
    const x = acc.find(item => item.userId === current.userId);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);

  return {
    ...summary,
    participants,
  };
}

export async function addSessionParticipant(sessionId: string, userId: string) {
  // Use onConflictDoNothing to avoid errors if user joins multiple times
  await db
    .insert(sessionParticipants)
    .values({
      sessionId,
      userId,
    })
    .onConflictDoNothing();
}

export async function updateParticipantRating(sessionId: string, userId: string, rating: number) {
  await db
    .insert(sessionParticipants)
    .values({
      sessionId,
      userId,
      rating,
    })
    .onConflictDoUpdate({
      target: [sessionParticipants.sessionId, sessionParticipants.userId],
      set: { rating },
    });
}

export async function getAverageRating(sessionId: string): Promise<number | null> {
  const result = await db
    .select({
      avgRating: sql<number>`avg(${sessionParticipants.rating})`,
    })
    .from(sessionParticipants)
    .where(
      and(
        eq(sessionParticipants.sessionId, sessionId),
        sql`${sessionParticipants.rating} is not null`
      )
    );

  return result[0]?.avgRating ? parseFloat(result[0].avgRating.toString()) : null;
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
                  eq(sessionParticipants.isBanned, false) // Filter out banned
                )
              )
          )
        )
      )
    )
    .orderBy(desc(tastingSessions.createdAt));

  return sessions;
}

export async function banParticipant(sessionId: string, userId: string) {
  await db
    .update(sessionParticipants)
    .set({ isBanned: true })
    .where(
      and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.userId, userId)
      )
    );
}

export async function unbanParticipant(sessionId: string, userId: string) {
  await db
    .update(sessionParticipants)
    .set({ isBanned: false })
    .where(
      and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.userId, userId)
      )
    );
}

export async function isParticipantBanned(sessionId: string, userId: string): Promise<boolean> {
  const participant = await db.query.sessionParticipants.findFirst({
    where: and(
      eq(sessionParticipants.sessionId, sessionId),
      eq(sessionParticipants.userId, userId)
    ),
  });
  return participant?.isBanned ?? false;
}

export async function getAllUserSummaries(userId: string) {
  const summaries = await db
    .select({
      summary: tastingSummaries,
      session: tastingSessions,
    })
    .from(tastingSummaries)
    .innerJoin(tastingSessions, eq(tastingSummaries.sessionId, tastingSessions.id))
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
                  eq(sessionParticipants.isBanned, false) // Filter out banned
                )
              )
          )
        )
      )
    )
    .orderBy(desc(tastingSummaries.createdAt));

  // Fetch participants for each summary
  const summariesWithParticipants = await Promise.all(
    summaries.map(async (s) => {
      const participants = await db
        .select({
          userId: sessionParticipants.userId,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          sharePersonalSummary: sessionParticipants.sharePersonalSummary,
          shareGroupSummary: sessionParticipants.shareGroupSummary,
          isHighlighted: sessionParticipants.isHighlighted,
        })
        .from(sessionParticipants)
        .leftJoin(users, eq(sessionParticipants.userId, users.id))
        .where(eq(sessionParticipants.sessionId, s.session.id));

      return {
        ...s,
        summary: {
          ...s.summary,
          participants,
        },
      };
    })
  );

  return summariesWithParticipants;
}

export async function updateSessionSummary(
  sessionId: string,
  data: {
    nose?: string;
    palate?: string;
    finish?: string;
    observations?: string;
    rating?: number;
  }
) {
  const existing = await getSessionSummary(sessionId);
  if (!existing) {
    throw new Error('Summary not found');
  }

  const metadata = {
    ...(existing.metadata as any),
  };

  if (data.rating !== undefined) {
    metadata.rating = data.rating;
  }

  const [updated] = await db
    .update(tastingSummaries)
    .set({
      nose: data.nose ?? existing.nose,
      palate: data.palate ?? existing.palate,
      finish: data.finish ?? existing.finish,
      observations: data.observations ?? existing.observations,
      metadata,
    })
    .where(eq(tastingSummaries.sessionId, sessionId))
    .returning();

  return updated;
}

// Transfer host to another user
export async function transferHost(sessionId: string, currentHostId: string, newHostId: string) {
  const session = await getSession(sessionId);

  if (!session || session.session.hostId !== currentHostId) {
    throw new Error('Unauthorized: Only the current host can transfer host privileges');
  }

  if (session.session.status !== 'active') {
    throw new Error('Cannot transfer host of an ended session');
  }

  // Verify new host exists
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

// Archive a session (host only)
export async function archiveSession(sessionId: string, userId: string) {
  const session = await getSession(sessionId);

  if (!session || session.session.hostId !== userId) {
    throw new Error('Unauthorized: Only the host can archive this session');
  }

  if (session.session.status === 'active') {
    throw new Error('Cannot archive an active session. End it first.');
  }

  const [updated] = await db
    .update(tastingSessions)
    .set({
      status: 'archived',
      updatedAt: sql`now()`,
    })
    .where(eq(tastingSessions.id, sessionId))
    .returning();

  return updated;
}

// Unarchive a session (host only)
export async function unarchiveSession(sessionId: string, userId: string) {
  const session = await getSession(sessionId);

  if (!session || session.session.hostId !== userId) {
    throw new Error('Unauthorized: Only the host can unarchive this session');
  }

  if (session.session.status !== 'archived') {
    throw new Error('Session is not archived');
  }

  const [updated] = await db
    .update(tastingSessions)
    .set({
      status: 'ended',
      updatedAt: sql`now()`,
    })
    .where(eq(tastingSessions.id, sessionId))
    .returning();

  return updated;
}

// Get archived sessions for a user
export async function getArchivedSessions(userId: string) {
  const sessions = await db
    .select({
      session: tastingSessions,
      host: users,
      summaryId: tastingSummaries.id,
      userRating: sessionParticipants.rating,
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
        eq(tastingSessions.status, 'archived'),
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
                  eq(sessionParticipants.isBanned, false) // Filter out banned
                )
              )
          )
        )
      )
    )
    .orderBy(desc(tastingSessions.createdAt));

  return sessions;
}

export async function updateParticipantSharing(
  sessionId: string,
  userId: string,
  data: {
    sharePersonalSummary?: boolean;
    shareGroupSummary?: boolean;
  }
) {
  const [updated] = await db
    .update(sessionParticipants)
    .set({
      ...data,
    })
    .where(
      and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.userId, userId)
      )
    )
    .returning();

  return updated;
}

export async function toggleSessionHighlight(sessionId: string, userId: string) {
  const participant = await db.query.sessionParticipants.findFirst({
    where: and(
      eq(sessionParticipants.sessionId, sessionId),
      eq(sessionParticipants.userId, userId)
    ),
  });

  if (!participant) {
    throw new Error('Participant not found');
  }

  const [updated] = await db
    .update(sessionParticipants)
    .set({
      isHighlighted: !participant.isHighlighted,
    })
    .where(
      and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.userId, userId)
      )
    )
    .returning();

  return updated;
}

export async function getPublicSummary(sessionId: string) {
  const summary = await db.query.tastingSummaries.findFirst({
    where: eq(tastingSummaries.sessionId, sessionId),
  });

  if (!summary) return null;

  const session = await getSession(sessionId);
  if (!session) return null;

  // Fetch ALL participants for the session
  const allParticipants = await db
    .select({
      userId: sessionParticipants.userId,
      rating: sessionParticipants.rating,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      sharePersonalSummary: sessionParticipants.sharePersonalSummary,
      shareGroupSummary: sessionParticipants.shareGroupSummary,
      isHighlighted: sessionParticipants.isHighlighted,
    })
    .from(sessionParticipants)
    .leftJoin(users, eq(sessionParticipants.userId, users.id))
    .where(eq(sessionParticipants.sessionId, sessionId));

  // Check if at least someone shared something (either personal or group)
  const hasAnySharer = allParticipants.some(
    (p) => p.sharePersonalSummary || p.shareGroupSummary
  );

  if (!hasAnySharer) return null;

  // Check if anyone shared the group summary
  const hasGroupSharer = allParticipants.some((p) => p.shareGroupSummary);

  // Filter tasterSummaries to ONLY include those who specifically shared their PERSONAL summary
  const sharedTasterSummaries = summary.tasterSummaries?.filter((ts) =>
    allParticipants.some((p) => p.userId === ts.userId && p.sharePersonalSummary === true)
  ) || [];

  // For participant list, only show those who shared something
  const sharedParticipants = allParticipants.filter(
    (p) => p.sharePersonalSummary || p.shareGroupSummary
  );

  // If no one shared the group summary, hide the group-level notes
  const publicSummary = hasGroupSharer ? {
    ...summary,
    tasterSummaries: sharedTasterSummaries,
  } : {
    ...summary,
    // Hide group-level notes when no one shared group summary
    nose: null,
    palate: null,
    finish: null,
    observations: null,
    tasterSummaries: sharedTasterSummaries,
  };

  return {
    ...publicSummary,
    participants: sharedParticipants,
    session: {
      ...session.session,
      host: session.host,
    },
  };
}



export async function getPublicUserSummaries(userId: string) {
  // Find sessions where this user shared either personal or group summary
  const sharedSessions = await db
    .select({
      sessionId: sessionParticipants.sessionId,
    })
    .from(sessionParticipants)
    .where(
      and(
        eq(sessionParticipants.userId, userId),
        or(
          eq(sessionParticipants.sharePersonalSummary, true),
          eq(sessionParticipants.shareGroupSummary, true)
        )
      )
    );


  if (sharedSessions.length === 0) return [];

  const sessionIds = sharedSessions.map((s) => s.sessionId);

  const summaries = await db
    .select({
      summary: tastingSummaries,
      session: tastingSessions,
      host: users,
      isHighlighted: sessionParticipants.isHighlighted,
    })
    .from(tastingSummaries)
    .innerJoin(tastingSessions, eq(tastingSummaries.sessionId, tastingSessions.id))
    .leftJoin(users, eq(tastingSessions.hostId, users.id))
    .innerJoin(sessionParticipants, and(
      eq(sessionParticipants.sessionId, tastingSessions.id),
      eq(sessionParticipants.userId, userId)
    ))
    .where(sql`${tastingSummaries.sessionId} IN ${sessionIds}`)
    .orderBy(desc(tastingSummaries.createdAt));

  return summaries;
}
