export interface User {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  email?: string;
  isPublic?: boolean;
  bio?: string | null;
}

export interface Session {
  id: string;
  name: string;
  productType: string | null;
  productLink: string | null;
  productName: string | null;
  hostId: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  customTags: string[];
  host?: User;
  summaryId?: string;
  userRating?: number | null;
  sharePersonalSummary?: boolean;
  shareGroupSummary?: boolean;
  shareSessionLog?: boolean;
  isHighlighted?: boolean;
}

export interface Message {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  phase?: string | null;
  createdAt: string;
  user: User;
}

export interface ActiveUser {
  userId: string;
  socketId: string;
  displayName: string | null;
  avatarUrl: string | null;
  rating?: number | null;
}

export interface Participant {
  userId: string;
  rating: number | null;
  displayName: string | null;
  avatarUrl: string | null;
  sharePersonalSummary?: boolean;
  shareGroupSummary?: boolean;
  shareSessionLog?: boolean;
}

// Socket event payloads
export interface JoinSessionPayload {
  sessionId: string;
}

export interface SendMessagePayload {
  sessionId: string;
  content: string;
  phase?: string;
}

export interface MessageHistoryEvent {
  messages: Message[];
  livestreamUrl?: string | null;
  customTags?: string[];
  hostId?: string | null;
}

export interface CustomTagsUpdatedEvent {
  sessionId: string;
  tags: string[];
}

export interface ActiveUsersEvent {
  users: ActiveUser[];
  moderators: string[]; // Array of user IDs who are moderators
}

export interface NewMessageEvent extends Message { }

export interface UserJoinedEvent {
  user: ActiveUser;
  userCount: number;
}

export interface UserLeftEvent {
  userId: string;
  userCount: number;
}

export interface ErrorEvent {
  message: string;
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
  isGlobal: boolean;
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

// User moderation events
export interface BannedUser {
  id: string;
  displayName: string | null;
}

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

export interface BannedUsersListEvent {
  mutedUsers: BannedUser[];
  kickedUsers: BannedUser[];
}

export interface MessagesErasedEvent {
  userId: string;
  messageIds: string[];
}

