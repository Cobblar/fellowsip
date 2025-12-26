export interface User {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
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
  host?: User;
  summaryId?: string;
  userRating?: number | null;
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

