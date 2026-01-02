import { db, tastingSessions, users } from '../db/index.js';
import { eq, sql } from 'drizzle-orm';
import { addSessionParticipant } from './participants.js';

export async function createSession(
    hostId: string,
    name: string,
    products: Array<{
        productType?: string | null;
        productLink?: string | null;
        productName?: string | null;
    }> = [],
    livestreamUrl: string | null = null,
    customTags: string[] = [],
    isSolo: boolean = false
) {
    // Normalize products array (max 3, add indices)
    const normalizedProducts = products.slice(0, 3).map((p, i) => ({
        index: i,
        productType: p.productType || null,
        productLink: p.productLink || null,
        productName: p.productName || null,
    }));

    // If no products provided, create a single empty product slot
    if (normalizedProducts.length === 0) {
        normalizedProducts.push({ index: 0, productType: null, productLink: null, productName: null });
    }

    const [session] = await db
        .insert(tastingSessions)
        .values({
            name,
            products: normalizedProducts,
            // Keep legacy fields for backward compatibility (use first product)
            productType: normalizedProducts[0]?.productType || null,
            productLink: normalizedProducts[0]?.productLink || null,
            productName: normalizedProducts[0]?.productName || null,
            livestreamUrl,
            customTags,
            hostId,
            isSolo,
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

export async function updateSessionActivity(sessionId: string) {
    await db
        .update(tastingSessions)
        .set({
            lastActivityAt: sql`now()`,
            updatedAt: sql`now()`,
        })
        .where(eq(tastingSessions.id, sessionId));
}
