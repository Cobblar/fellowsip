export interface SocketUser {
  userId: string;
  socketId: string;
  displayName: string | null;
  avatarUrl: string | null;
  rating?: number | null;
}

export interface JoinSessionPayload {
  sessionId: string;
}

export interface SendMessagePayload {
  sessionId: string;
  content: string;
  phase?: string;
}

export interface MessageData {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  phase?: string | null;
  createdAt: Date;
  user: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export interface UserJoinedData {
  user: SocketUser;
  userCount: number;
}

export interface UserLeftData {
  userId: string;
  userCount: number;
}

export interface ActiveUsersData {
  users: SocketUser[];
  moderators: string[]; // Array of user IDs who are moderators
}

// Moderation payloads
export interface DeleteMessagePayload {
  sessionId: string;
  messageId: string;
}

export interface EditMessagePayload {
  sessionId: string;
  messageId: string;
  content: string;
}

export interface MakeModeratorPayload {
  sessionId: string;
  userId: string;
}

export interface RevealSpoilersPayload {
  sessionId: string;
  upToMessageId: string; // Reveal spoilers up to and including this message
}

// Moderation events
export interface MessageDeletedEvent {
  messageId: string;
  deletedBy: string;
}

export interface MessageUpdatedEvent {
  messageId: string;
  content: string;
}

export interface ModeratorAddedEvent {
  userId: string;
  displayName: string | null;
}

export interface SpoilersRevealedEvent {
  messageIds: string[];
  revealedBy: string;
  isGlobal: boolean; // true if host revealed for everyone, false if personal reveal
}

export interface UpdateRatingPayload {
  sessionId: string;
  rating: number;
}

export interface RatingUpdatedEvent {
  userId: string;
  rating: number;
  averageRating: number | null;
}

// Ready check payloads
export interface StartReadyCheckPayload {
  sessionId: string;
}

export interface EndReadyCheckPayload {
  sessionId: string;
}

export interface MarkReadyPayload {
  sessionId: string;
}

// Ready check events
export interface ReadyCheckStartedEvent {
  sessionId: string;
  startedBy: string;
}

export interface ReadyCheckEndedEvent {
  sessionId: string;
}

export interface UserReadyEvent {
  userId: string;
  displayName: string | null;
}

export interface ReadyCheckStateEvent {
  isActive: boolean;
  readyUsers: string[];
  totalUsers: number;
}

// User moderation payloads
export interface MuteUserPayload {
  sessionId: string;
  userId: string;
  eraseMessages?: boolean;
}

export interface UnmuteUserPayload {
  sessionId: string;
  userId: string;
}

export interface KickUserPayload {
  sessionId: string;
  userId: string;
  eraseMessages?: boolean;
}

export interface UnkickUserPayload {
  sessionId: string;
  userId: string;
}

// User moderation events
export interface UserMutedEvent {
  userId: string;
  displayName: string | null;
}

export interface UserUnmutedEvent {
  userId: string;
  displayName: string | null;
}

export interface UserKickedEvent {
  userId: string;
  displayName: string | null;
}

export interface UserUnkickedEvent {
  userId: string;
  displayName: string | null;
}

export interface YouWereKickedEvent {
  sessionId: string;
  message: string;
}

export interface YouWereMutedEvent {
  sessionId: string;
  message: string;
}

export interface YouWereUnmutedEvent {
  sessionId: string;
}

export interface BannedUser {
  id: string;
  displayName: string | null;
}

export interface BannedUsersListEvent {
  mutedUsers: BannedUser[];
  kickedUsers: BannedUser[];
}

export interface MessagesErasedEvent {
  userId: string;
  messageIds: string[];
}
