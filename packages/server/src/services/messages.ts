import { db, messages, users } from '../db/index.js';
import { eq, desc, and } from 'drizzle-orm';

export async function createMessage(sessionId: string, userId: string, content: string, phase?: string) {
  const [message] = await db
    .insert(messages)
    .values({
      sessionId,
      userId,
      content,
      phase,
    })
    .returning();

  // Fetch the message with user info
  const [messageWithUser] = await db
    .select({
      message: messages,
      user: users,
    })
    .from(messages)
    .leftJoin(users, eq(messages.userId, users.id))
    .where(eq(messages.id, message.id));

  return messageWithUser;
}

export async function getSessionMessages(sessionId: string, limit: number = 100) {
  const results = await db
    .select({
      message: messages,
      user: users,
    })
    .from(messages)
    .leftJoin(users, eq(messages.userId, users.id))
    .where(and(
      eq(messages.sessionId, sessionId),
      eq(messages.isHidden, false) // Filter out hidden messages
    ))
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  return results.reverse(); // Return oldest first
}

export async function getMessageCount(sessionId: string) {
  const result = await db
    .select()
    .from(messages)
    .where(and(
      eq(messages.sessionId, sessionId),
      eq(messages.isHidden, false) // Only count visible messages
    ));

  return result.length;
}

// Hide a message (soft delete)
export async function hideMessage(messageId: string) {
  const [updated] = await db
    .update(messages)
    .set({ isHidden: true })
    .where(eq(messages.id, messageId))
    .returning();

  return updated;
}

// Update a message's content
export async function updateMessage(messageId: string, content: string) {
  const [updated] = await db
    .update(messages)
    .set({
      content
    })
    .where(eq(messages.id, messageId))
    .returning();

  return updated;
}

// Get message by ID (including hidden, for validation)
export async function getMessage(messageId: string) {
  const [message] = await db
    .select()
    .from(messages)
    .where(eq(messages.id, messageId));

  return message;
}

