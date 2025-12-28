import type { Server } from 'socket.io';

let ioInstance: Server | null = null;

// Track user ID to socket IDs mapping (a user can have multiple sockets/tabs open)
const userSockets = new Map<string, Set<string>>();

export function setSocketIO(io: Server) {
    ioInstance = io;
}

export function getSocketIO(): Server | null {
    return ioInstance;
}

// Register a socket for a user (called when user authenticates)
export function registerUserSocket(userId: string, socketId: string) {
    if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socketId);
}

// Unregister a socket for a user (called when socket disconnects)
export function unregisterUserSocket(userId: string, socketId: string) {
    const sockets = userSockets.get(userId);
    if (sockets) {
        sockets.delete(socketId);
        if (sockets.size === 0) {
            userSockets.delete(userId);
        }
    }
}

// Emit an event to a specific user (all their connected sockets/tabs)
export function emitToUser(userId: string, event: string, data: any) {
    if (!ioInstance) return;

    const sockets = userSockets.get(userId);
    if (sockets) {
        sockets.forEach(socketId => {
            ioInstance!.to(socketId).emit(event, data);
        });
    }
}

// Emit session ended event to all users in the session
export function emitSessionEnded(sessionId: string, hostName: string, shouldAnalyze: boolean = false) {
    if (ioInstance) {
        ioInstance.to(sessionId).emit('session_ended', {
            sessionId,
            hostName,
            shouldAnalyze,
            message: `${hostName} has ended the session`,
        });
    }
}

// Emit summary generated event to all users in the session
export function emitSummaryGenerated(sessionId: string, summaryId: string) {
    if (ioInstance) {
        ioInstance.to(sessionId).emit('summary_generated', {
            sessionId,
            summaryId,
        });
    }
}

// Emit host transferred event to all users in the session
export function emitHostTransferred(sessionId: string, newHostId: string, newHostName: string) {
    if (ioInstance) {
        ioInstance.to(sessionId).emit('host_transferred', {
            sessionId,
            newHostId,
            newHostName,
            message: `${newHostName} is now the host`,
        });
    }
}

// Emit livestream updated event to all users in the session
export function emitLivestreamUpdated(sessionId: string, url: string | null) {
    if (ioInstance) {
        ioInstance.to(sessionId).emit('livestream_updated', {
            sessionId,
            url,
        });
    }
}

// Emit custom tags updated event to all users in the session
export function emitCustomTagsUpdated(sessionId: string, tags: string[]) {
    if (ioInstance) {
        ioInstance.to(sessionId).emit('custom_tags_updated', {
            sessionId,
            tags,
        });
    }
}

