import type { Server, Socket } from 'socket.io';
import { getSession } from '../services/sessions.js';
import {
    getSessionUsers,
    startReadyCheck as startCheck,
    endReadyCheck as endCheck,
    markUserReady,
    markUserUnready,
    isReadyCheckActive,
    getReadyUsers,
} from '../services/activeUsers.js';
import type {
    StartReadyCheckPayload,
    EndReadyCheckPayload,
    MarkReadyPayload,
    ReadyCheckStateEvent,
} from '../types/socket.js';

export const broadcastReadyCheckState = (io: Server, sessionId: string) => {
    const activeUsers = getSessionUsers(sessionId);
    const readyUsers = getReadyUsers(sessionId);
    const event: ReadyCheckStateEvent = {
        isActive: isReadyCheckActive(sessionId),
        readyUsers,
        totalUsers: activeUsers.length,
    };
    io.to(sessionId).emit('ready_check_state', event);
};

export function setupReadyCheckHandlers(io: Server, socket: Socket, userId: string, user: any) {
    socket.on('start_ready_check', async (payload: StartReadyCheckPayload) => {
        try {
            const { sessionId } = payload;
            const session = await getSession(sessionId);
            if (!session || session.session.hostId !== userId) {
                socket.emit('error', { message: 'Only the host can start a ready check' });
                return;
            }

            startCheck(sessionId);
            io.to(sessionId).emit('ready_check_started', {
                sessionId,
                startedBy: user.displayName || 'Host',
            });
            broadcastReadyCheckState(io, sessionId);
        } catch (error) {
            console.error('Start ready check error:', error);
            socket.emit('error', { message: 'Failed to start ready check' });
        }
    });

    socket.on('end_ready_check', async (payload: EndReadyCheckPayload) => {
        try {
            const { sessionId } = payload;
            const session = await getSession(sessionId);
            if (!session || session.session.hostId !== userId) {
                socket.emit('error', { message: 'Only the host can end a ready check' });
                return;
            }

            endCheck(sessionId);
            io.to(sessionId).emit('ready_check_ended', { sessionId });
            broadcastReadyCheckState(io, sessionId);
        } catch (error) {
            console.error('End ready check error:', error);
            socket.emit('error', { message: 'Failed to end ready check' });
        }
    });

    socket.on('mark_ready', async (payload: MarkReadyPayload) => {
        try {
            const { sessionId } = payload;
            if (!isReadyCheckActive(sessionId)) return;

            markUserReady(sessionId, userId);
            io.to(sessionId).emit('user_ready', {
                userId: userId,
                displayName: user.displayName,
            });
            broadcastReadyCheckState(io, sessionId);
        } catch (error) {
            console.error('Mark ready error:', error);
        }
    });

    socket.on('mark_unready', async (payload: MarkReadyPayload) => {
        try {
            const { sessionId } = payload;
            if (!isReadyCheckActive(sessionId)) return;

            markUserUnready(sessionId, userId);
            broadcastReadyCheckState(io, sessionId);
        } catch (error) {
            console.error('Mark unready error:', error);
        }
    });
}
