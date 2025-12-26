import type { SocketUser } from '../types/socket.js';

// In-memory store for active users per session
const sessionUsers = new Map<string, Map<string, SocketUser>>();

export function addUserToSession(sessionId: string, user: SocketUser) {
  if (!sessionUsers.has(sessionId)) {
    sessionUsers.set(sessionId, new Map());
  }

  const users = sessionUsers.get(sessionId)!;
  users.set(user.socketId, user);
}

export function updateUserRating(sessionId: string, userId: string, rating: number) {
  const users = sessionUsers.get(sessionId);
  if (users) {
    for (const user of users.values()) {
      if (user.userId === userId) {
        user.rating = rating;
      }
    }
  }
}

export function removeUserFromSession(sessionId: string, socketId: string) {
  const users = sessionUsers.get(sessionId);
  if (users) {
    users.delete(socketId);
    if (users.size === 0) {
      sessionUsers.delete(sessionId);
    }
  }
}

export function getSessionUsers(sessionId: string): SocketUser[] {
  const users = sessionUsers.get(sessionId);
  return users ? Array.from(users.values()) : [];
}

export function getUserSessions(socketId: string): string[] {
  const sessions: string[] = [];
  for (const [sessionId, users] of sessionUsers.entries()) {
    if (users.has(socketId)) {
      sessions.push(sessionId);
    }
  }
  return sessions;
}

export function removeUserFromAllSessions(socketId: string) {
  const sessions = getUserSessions(socketId);
  sessions.forEach((sessionId) => {
    removeUserFromSession(sessionId, socketId);
  });
}

// In-memory store for moderators per session (by userId, not socketId)
const sessionModerators = new Map<string, Set<string>>();

export function addModerator(sessionId: string, userId: string) {
  if (!sessionModerators.has(sessionId)) {
    sessionModerators.set(sessionId, new Set());
  }
  sessionModerators.get(sessionId)!.add(userId);
}

export function removeModerator(sessionId: string, userId: string) {
  const mods = sessionModerators.get(sessionId);
  if (mods) {
    mods.delete(userId);
    if (mods.size === 0) {
      sessionModerators.delete(sessionId);
    }
  }
}

export function isModerator(sessionId: string, userId: string): boolean {
  const mods = sessionModerators.get(sessionId);
  return mods ? mods.has(userId) : false;
}

export function getSessionModerators(sessionId: string): string[] {
  const mods = sessionModerators.get(sessionId);
  return mods ? Array.from(mods) : [];
}

export function clearSessionModerators(sessionId: string) {
  sessionModerators.delete(sessionId);
}

