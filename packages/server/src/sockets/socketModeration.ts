import type { Server, Socket } from 'socket.io';
import { getSession } from '../services/sessions.js';
import {
    isModerator,
    getSessionModerators,
    muteUser,
    unmuteUser,
    getMutedUsers,
    kickUser,
    unkickUser,
    getKickedUsers,
    getSessionUsers,
    removeUserFromSession,
    addModerator,
    removeModerator,
} from '../services/activeUsers.js';
import { hideMessage, getMessage, hideAllMessagesFromUser } from '../services/messages.js';
import { banParticipant, unbanParticipant } from '../services/sessions.js';
import type {
    DeleteMessagePayload,
    MakeModeratorPayload,
    MuteUserPayload,
    UnmuteUserPayload,
    KickUserPayload,
    UnkickUserPayload,
} from '../types/socket.js';

export async function canModerateSession(sessionId: string, modUserId: string): Promise<boolean> {
    const session = await getSession(sessionId);
    if (!session) return false;
    return session.session.hostId === modUserId || isModerator(sessionId, modUserId);
}

export const broadcastBannedUsers = async (io: Server, sessionId: string) => {
    const session = await getSession(sessionId);
    if (!session) return;

    const bannedUsersEvent = {
        mutedUsers: getMutedUsers(sessionId),
        kickedUsers: getKickedUsers(sessionId),
    };

    // Send to host
    const hostSockets = getSessionUsers(sessionId).filter(u => u.userId === session.session.hostId);
    hostSockets.forEach(u => {
        io.to(u.socketId).emit('banned_users_list', bannedUsersEvent);
    });

    // Send to moderators
    const mods = getSessionModerators(sessionId);
    mods.forEach(modId => {
        const modSockets = getSessionUsers(sessionId).filter(u => u.userId === modId);
        modSockets.forEach(u => {
            io.to(u.socketId).emit('banned_users_list', bannedUsersEvent);
        });
    });
};

export function setupModerationHandlers(io: Server, socket: Socket, userId: string, user: any) {
    socket.on('delete_message', async (payload: DeleteMessagePayload) => {
        try {
            const { sessionId, messageId } = payload;
            if (!(await canModerateSession(sessionId, userId))) {
                socket.emit('error', { message: 'Only host or moderators can delete messages' });
                return;
            }

            const message = await getMessage(messageId);
            if (!message || message.sessionId !== sessionId) {
                socket.emit('error', { message: 'Message not found' });
                return;
            }

            await hideMessage(messageId);
            io.to(sessionId).emit('message_deleted', {
                messageId,
                deletedBy: user.displayName || 'Moderator',
            });
        } catch (error) {
            console.error('Delete message error:', error);
            socket.emit('error', { message: 'Failed to delete message' });
        }
    });

    socket.on('make_moderator', async (payload: MakeModeratorPayload) => {
        try {
            const { sessionId, userId: targetUserId } = payload;
            const session = await getSession(sessionId);
            if (!session || session.session.hostId !== userId) {
                socket.emit('error', { message: 'Only the host can assign moderators' });
                return;
            }

            if (targetUserId === userId) {
                socket.emit('error', { message: 'Host already has full permissions' });
                return;
            }

            addModerator(sessionId, targetUserId);
            const targetUser = getSessionUsers(sessionId).find(u => u.userId === targetUserId);
            io.to(sessionId).emit('moderator_added', {
                userId: targetUserId,
                displayName: targetUser?.displayName || null,
            });

            const activeUsers = getSessionUsers(sessionId);
            const moderators = getSessionModerators(sessionId);
            io.to(sessionId).emit('active_users', { users: activeUsers, moderators });
        } catch (error) {
            console.error('Make moderator error:', error);
            socket.emit('error', { message: 'Failed to assign moderator' });
        }
    });

    socket.on('unmod_user', async (payload: { sessionId: string; userId: string }) => {
        try {
            const { sessionId, userId: targetUserId } = payload;
            const session = await getSession(sessionId);
            if (!session || session.session.hostId !== userId) {
                socket.emit('error', { message: 'Only the host can remove moderators' });
                return;
            }

            removeModerator(sessionId, targetUserId);
            io.to(sessionId).emit('moderator_removed', { userId: targetUserId });

            const activeUsers = getSessionUsers(sessionId);
            const moderators = getSessionModerators(sessionId);
            io.to(sessionId).emit('active_users', { users: activeUsers, moderators });
        } catch (error) {
            console.error('Unmod user error:', error);
            socket.emit('error', { message: 'Failed to remove moderator' });
        }
    });

    socket.on('mute_user', async (payload: MuteUserPayload) => {
        try {
            const { sessionId, userId: targetUserId, eraseMessages } = payload;
            if (!(await canModerateSession(sessionId, userId))) {
                socket.emit('error', { message: 'You do not have permission to mute users' });
                return;
            }

            const targetUser = getSessionUsers(sessionId).find(u => u.userId === targetUserId);
            if (!targetUser) {
                socket.emit('error', { message: 'User not found in session' });
                return;
            }

            muteUser(sessionId, targetUserId, targetUser.displayName);

            if (eraseMessages) {
                const erasedMessageIds = await hideAllMessagesFromUser(sessionId, targetUserId);
                if (erasedMessageIds.length > 0) {
                    io.to(sessionId).emit('messages_erased', {
                        userId: targetUserId,
                        messageIds: erasedMessageIds,
                    });
                }
            }

            const targetSockets = getSessionUsers(sessionId).filter(u => u.userId === targetUserId);
            targetSockets.forEach(u => {
                io.to(u.socketId).emit('you_were_muted', {
                    sessionId,
                    message: eraseMessages
                        ? 'You have been muted in this session and your messages have been removed.'
                        : 'You have been muted in this session.',
                });
            });

            io.to(sessionId).emit('user_muted', {
                userId: targetUserId,
                displayName: targetUser.displayName,
            });

            broadcastBannedUsers(io, sessionId);
        } catch (error) {
            console.error('Mute user error:', error);
            socket.emit('error', { message: 'Failed to mute user' });
        }
    });

    socket.on('unmute_user', async (payload: UnmuteUserPayload) => {
        try {
            const { sessionId, userId: targetUserId } = payload;
            if (!(await canModerateSession(sessionId, userId))) {
                socket.emit('error', { message: 'You do not have permission to unmute users' });
                return;
            }

            const mutedList = getMutedUsers(sessionId);
            const mutedUser = mutedList.find(u => u.id === targetUserId);

            unmuteUser(sessionId, targetUserId);

            const targetSockets = getSessionUsers(sessionId).filter(u => u.userId === targetUserId);
            targetSockets.forEach(u => {
                io.to(u.socketId).emit('you_were_unmuted', { sessionId });
            });

            io.to(sessionId).emit('user_unmuted', {
                userId: targetUserId,
                displayName: mutedUser?.displayName || null,
            });

            broadcastBannedUsers(io, sessionId);
        } catch (error) {
            console.error('Unmute user error:', error);
            socket.emit('error', { message: 'Failed to unmute user' });
        }
    });

    socket.on('kick_user', async (payload: KickUserPayload) => {
        try {
            const { sessionId, userId: targetUserId } = payload;
            if (!(await canModerateSession(sessionId, userId))) {
                socket.emit('error', { message: 'You do not have permission to kick users' });
                return;
            }

            const targetUser = getSessionUsers(sessionId).find(u => u.userId === targetUserId);
            const displayName = targetUser?.displayName || null;

            kickUser(sessionId, targetUserId, displayName);
            await banParticipant(sessionId, targetUserId);

            const erasedMessageIds = await hideAllMessagesFromUser(sessionId, targetUserId);
            if (erasedMessageIds.length > 0) {
                io.to(sessionId).emit('messages_erased', {
                    userId: targetUserId,
                    messageIds: erasedMessageIds,
                });
            }

            const targetSockets = getSessionUsers(sessionId).filter(u => u.userId === targetUserId);
            targetSockets.forEach(u => {
                io.to(u.socketId).emit('you_were_kicked', {
                    sessionId,
                    message: 'You have been removed from this session.',
                });
                removeUserFromSession(sessionId, u.socketId);
                setTimeout(() => {
                    const targetSocket = io.sockets.sockets.get(u.socketId);
                    if (targetSocket) {
                        targetSocket.leave(sessionId);
                    }
                }, 500);
            });

            io.to(sessionId).emit('user_kicked', {
                userId: targetUserId,
                displayName,
            });

            const activeUsers = getSessionUsers(sessionId);
            const moderators = getSessionModerators(sessionId);
            io.to(sessionId).emit('active_users', { users: activeUsers, moderators });

            broadcastBannedUsers(io, sessionId);
        } catch (error) {
            console.error('Kick user error:', error);
            socket.emit('error', { message: 'Failed to kick user' });
        }
    });

    socket.on('unkick_user', async (payload: UnkickUserPayload) => {
        try {
            const { sessionId, userId: targetUserId } = payload;
            const session = await getSession(sessionId);
            if (!session || session.session.hostId !== userId) {
                socket.emit('error', { message: 'Only the host can unkick users' });
                return;
            }

            const kickedList = getKickedUsers(sessionId);
            const kickedUser = kickedList.find(u => u.id === targetUserId);

            unkickUser(sessionId, targetUserId);
            await unbanParticipant(sessionId, targetUserId);

            io.to(sessionId).emit('user_unkicked', {
                userId: targetUserId,
                displayName: kickedUser?.displayName || null,
            });

            broadcastBannedUsers(io, sessionId);
        } catch (error) {
            console.error('Unkick user error:', error);
            socket.emit('error', { message: 'Failed to unkick user' });
        }
    });

    socket.on('get_banned_users', async (payload: { sessionId: string }) => {
        try {
            const { sessionId } = payload;
            if (!(await canModerateSession(sessionId, userId))) {
                socket.emit('error', { message: 'You do not have permission to view banned users' });
                return;
            }

            socket.emit('banned_users_list', {
                mutedUsers: getMutedUsers(sessionId),
                kickedUsers: getKickedUsers(sessionId),
            });
        } catch (error) {
            console.error('Get banned users error:', error);
            socket.emit('error', { message: 'Failed to get banned users' });
        }
    });
}
