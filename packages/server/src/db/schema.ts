import { pgTable, text, timestamp, uuid, jsonb, index, primaryKey, boolean, real, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Users table - for authentication and user profiles
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  preferences: jsonb('preferences').$type<{
    theme?: 'light' | 'dark';
    notifications?: boolean;
    [key: string]: any;
  }>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
});

// Sessions table - for Lucia Auth session management
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().default(sql`now()`),
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
}));

// OAuth Accounts table - for linking OAuth providers to users
export const oauthAccounts = pgTable('oauth_accounts', {
  providerId: text('provider_id').notNull(),
  providerUserId: text('provider_user_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  pk: primaryKey({ columns: [table.providerId, table.providerUserId] }),
}));

// Tasting Sessions table - for collaborative tasting events/rooms
export const tastingSessions = pgTable('tasting_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  productType: text('product_type'),
  productLink: text('product_link'),
  productName: text('product_name'),
  livestreamUrl: text('livestream_url'),
  hostId: text('host_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('active'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().default(sql`now()`),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().default(sql`now()`),
  customTags: jsonb('custom_tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  hostIdIdx: index('tasting_sessions_host_id_idx').on(table.hostId),
  statusIdx: index('tasting_sessions_status_idx').on(table.status),
}));

// Messages table - for chat messages during tasting sessions
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => tastingSessions.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  phase: text('phase'),
  isHidden: boolean('is_hidden').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  sessionIdIdx: index('messages_session_id_idx').on(table.sessionId),
  createdAtIdx: index('messages_created_at_idx').on(table.createdAt),
}));

// Tasting Summaries table - for AI-generated summaries
export const tastingSummaries = pgTable('tasting_summaries', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .unique()
    .references(() => tastingSessions.id, { onDelete: 'cascade' }),
  nose: text('nose'),
  palate: text('palate'),
  finish: text('finish'),
  observations: text('observations'),
  tasterSummaries: jsonb('taster_summaries').$type<Array<{
    userId: string;
    userName: string;
    nose: string;
    palate: string;
    finish: string;
    observations: string;
  }>>(),
  metadata: jsonb('metadata').$type<{
    rating?: number;
    tags?: string[];
    participants?: string[];
    [key: string]: any;
  }>(),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().default(sql`now()`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
});

// Friendships table - for managing friend connections
export const friendships = pgTable('friendships', {
  id: uuid('id').defaultRandom().primaryKey(),
  senderId: text('sender_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  receiverId: text('receiver_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'), // 'pending' | 'accepted' | 'rejected'
  autoMod: boolean('auto_mod').notNull().default(false), // Auto-promote to moderator when joining host's session
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  senderIdx: index('friendships_sender_id_idx').on(table.senderId),
  receiverIdx: index('friendships_receiver_id_idx').on(table.receiverId),
}));

// Session Join Requests table - for "Request to Join" friend's sessions
export const sessionJoinRequests = pgTable('session_join_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => tastingSessions.id, { onDelete: 'cascade' }),
  requesterId: text('requester_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  sessionIdx: index('session_join_requests_session_id_idx').on(table.sessionId),
  requesterIdx: index('session_join_requests_requester_id_idx').on(table.requesterId),
}));

// Session Participants table - for tracking who attended a session
export const sessionParticipants = pgTable('session_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => tastingSessions.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  rating: real('rating'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  sessionIdx: index('session_participants_session_id_idx').on(table.sessionId),
  userIdx: index('session_participants_user_id_idx').on(table.userId),
  uniqueParticipant: uniqueIndex('unique_session_participant_idx').on(table.sessionId, table.userId),
}));

// Relations for better querying
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  oauthAccounts: many(oauthAccounts),
  hostedTastingSessions: many(tastingSessions),
  messages: many(messages),
  sentFriendRequests: many(friendships, { relationName: 'sender' }),
  receivedFriendRequests: many(friendships, { relationName: 'receiver' }),
  sessionJoinRequests: many(sessionJoinRequests),
  participatedSessions: many(sessionParticipants),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userId],
    references: [users.id],
  }),
}));

export const tastingSessionsRelations = relations(tastingSessions, ({ one, many }) => ({
  host: one(users, {
    fields: [tastingSessions.hostId],
    references: [users.id],
  }),
  messages: many(messages),
  summary: one(tastingSummaries),
  joinRequests: many(sessionJoinRequests),
  participants: many(sessionParticipants),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  session: one(tastingSessions, {
    fields: [messages.sessionId],
    references: [tastingSessions.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

export const tastingSummariesRelations = relations(tastingSummaries, ({ one }) => ({
  session: one(tastingSessions, {
    fields: [tastingSummaries.sessionId],
    references: [tastingSessions.id],
  }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  sender: one(users, {
    fields: [friendships.senderId],
    references: [users.id],
    relationName: 'sender',
  }),
  receiver: one(users, {
    fields: [friendships.receiverId],
    references: [users.id],
    relationName: 'receiver',
  }),
}));

export const sessionJoinRequestsRelations = relations(sessionJoinRequests, ({ one }) => ({
  session: one(tastingSessions, {
    fields: [sessionJoinRequests.sessionId],
    references: [tastingSessions.id],
  }),
  requester: one(users, {
    fields: [sessionJoinRequests.requesterId],
    references: [users.id],
  }),
}));

export const sessionParticipantsRelations = relations(sessionParticipants, ({ one }) => ({
  session: one(tastingSessions, {
    fields: [sessionParticipants.sessionId],
    references: [tastingSessions.id],
  }),
  user: one(users, {
    fields: [sessionParticipants.userId],
    references: [users.id],
  }),
}));

// Notifications table - for user notifications
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'friend_request' | 'friend_accepted' | 'join_request' | 'join_approved' | 'join_rejected' | 'session_started' | 'made_moderator' | 'session_synthesized'
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link'), // Optional link to navigate to (e.g., /profile, /session/xyz)
  isRead: boolean('is_read').notNull().default(false),
  metadata: jsonb('metadata').$type<{
    fromUserId?: string;
    fromUserName?: string;
    sessionId?: string;
    sessionName?: string;
    friendshipId?: string;
    [key: string]: any;
  }>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  userIdIdx: index('notifications_user_id_idx').on(table.userId),
  createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Type exports for use in application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type NewOAuthAccount = typeof oauthAccounts.$inferInsert;

export type TastingSession = typeof tastingSessions.$inferSelect;
export type NewTastingSession = typeof tastingSessions.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type TastingSummary = typeof tastingSummaries.$inferSelect;
export type NewTastingSummary = typeof tastingSummaries.$inferInsert;

export type Friendship = typeof friendships.$inferSelect;
export type NewFriendship = typeof friendships.$inferInsert;

export type SessionJoinRequest = typeof sessionJoinRequests.$inferSelect;
export type NewSessionJoinRequest = typeof sessionJoinRequests.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type SessionParticipant = typeof sessionParticipants.$inferSelect;
export type NewSessionParticipant = typeof sessionParticipants.$inferInsert;

