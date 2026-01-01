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

export function updateUserRating(sessionId: string, userId: string, rating: number, productIndex: number = 0) {
  const users = sessionUsers.get(sessionId);
  if (users) {
    for (const user of users.values()) {
      if (user.userId === userId) {
        if (!user.ratings) {
          user.ratings = {};
        }
        user.ratings[productIndex] = rating;
        // Keep legacy rating for backward compatibility (first product)
        if (productIndex === 0) {
          user.rating = rating;
        }
      }
    }
  }
}

export function updateUserValueGrade(sessionId: string, userId: string, valueGrade: string, productIndex: number = 0) {
  const users = sessionUsers.get(sessionId);
  if (users) {
    for (const user of users.values()) {
      if (user.userId === userId) {
        if (!user.valueGrades) {
          user.valueGrades = {};
        }
        user.valueGrades[productIndex] = valueGrade;
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
  if (!users) return [];

  // Deduplicate by userId - keep only the first socket connection per user
  const uniqueUsers = new Map<string, SocketUser>();
  for (const user of users.values()) {
    if (!uniqueUsers.has(user.userId)) {
      uniqueUsers.set(user.userId, user);
    }
  }
  return Array.from(uniqueUsers.values());
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

// In-memory store for ready check state per session
const readyCheckState = new Map<string, Set<string>>(); // sessionId -> Set of ready userIds

export function startReadyCheck(sessionId: string): void {
  readyCheckState.set(sessionId, new Set());
}

export function endReadyCheck(sessionId: string): void {
  readyCheckState.delete(sessionId);
}

export function markUserReady(sessionId: string, userId: string): boolean {
  const readyUsers = readyCheckState.get(sessionId);
  if (!readyUsers) return false; // No active check
  readyUsers.add(userId);
  return true;
}

export function markUserUnready(sessionId: string, userId: string): boolean {
  const readyUsers = readyCheckState.get(sessionId);
  if (!readyUsers) return false; // No active check
  readyUsers.delete(userId);
  return true;
}

export function isReadyCheckActive(sessionId: string): boolean {
  return readyCheckState.has(sessionId);
}

export function getReadyUsers(sessionId: string): string[] {
  const readyUsers = readyCheckState.get(sessionId);
  return readyUsers ? Array.from(readyUsers) : [];
}

export function isUserReady(sessionId: string, userId: string): boolean {
  const readyUsers = readyCheckState.get(sessionId);
  return readyUsers ? readyUsers.has(userId) : false;
}

// In-memory store for muted users per session
// sessionId -> Map<userId, displayName>
const mutedUsers = new Map<string, Map<string, string | null>>();

export function muteUser(sessionId: string, userId: string, displayName: string | null): void {
  if (!mutedUsers.has(sessionId)) {
    mutedUsers.set(sessionId, new Map());
  }
  mutedUsers.get(sessionId)!.set(userId, displayName);
}

export function unmuteUser(sessionId: string, userId: string): void {
  const muted = mutedUsers.get(sessionId);
  if (muted) {
    muted.delete(userId);
    if (muted.size === 0) {
      mutedUsers.delete(sessionId);
    }
  }
}

export function isUserMuted(sessionId: string, userId: string): boolean {
  const muted = mutedUsers.get(sessionId);
  return muted ? muted.has(userId) : false;
}

export function getMutedUsers(sessionId: string): { id: string; displayName: string | null }[] {
  const muted = mutedUsers.get(sessionId);
  if (!muted) return [];
  return Array.from(muted.entries()).map(([id, displayName]) => ({ id, displayName }));
}

// In-memory store for kicked users per session
// sessionId -> Map<userId, displayName>
const kickedUsers = new Map<string, Map<string, string | null>>();

export function kickUser(sessionId: string, userId: string, displayName: string | null): void {
  if (!kickedUsers.has(sessionId)) {
    kickedUsers.set(sessionId, new Map());
  }
  kickedUsers.get(sessionId)!.set(userId, displayName);
}

export function unkickUser(sessionId: string, userId: string): void {
  const kicked = kickedUsers.get(sessionId);
  if (kicked) {
    kicked.delete(userId);
    if (kicked.size === 0) {
      kickedUsers.delete(sessionId);
    }
  }
}

export function isUserKicked(sessionId: string, userId: string): boolean {
  const kicked = kickedUsers.get(sessionId);
  return kicked ? kicked.has(userId) : false;
}

export function getKickedUsers(sessionId: string): { id: string; displayName: string | null }[] {
  const kicked = kickedUsers.get(sessionId);
  if (!kicked) return [];
  return Array.from(kicked.entries()).map(([id, displayName]) => ({ id, displayName }));
}

