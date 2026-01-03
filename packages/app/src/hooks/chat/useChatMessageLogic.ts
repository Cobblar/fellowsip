import { useState, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Message, MessageHistoryEvent, NewMessageEvent, MessageDeletedEvent, MessageUpdatedEvent, SpoilersRevealedEvent } from '../../types';

export const useChatMessageLogic = (socket: Socket | null, sessionId: string | null, sessionEnded: boolean) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [revealedMessageIds, setRevealedMessageIds] = useState<Set<string>>(new Set());
    const [globallyRevealedMessageIds, setGloballyRevealedMessageIds] = useState<Set<string>>(new Set());

    const sendMessage = useCallback((content: string, phase?: string, productIndex: number = 0, tags: string[] = []) => {
        if (socket && sessionId && content.trim() && !sessionEnded) {
            socket.emit('send_message', {
                sessionId,
                content: content.trim(),
                phase,
                productIndex,
                tags,
            });
        }
    }, [socket, sessionId, sessionEnded]);

    const deleteMessage = useCallback((messageId: string) => {
        if (socket && sessionId) {
            socket.emit('delete_message', {
                sessionId,
                messageId,
            });
        }
    }, [socket, sessionId]);

    const editMessage = useCallback((messageId: string, content: string) => {
        if (socket && sessionId && content.trim()) {
            socket.emit('edit_message', {
                sessionId,
                messageId,
                content: content.trim(),
            });
        }
    }, [socket, sessionId]);

    const revealAllSpoilers = useCallback((productIndex?: number) => {
        if (socket && sessionId && messages.length > 0) {
            const filteredMessages = productIndex !== undefined
                ? messages.filter(m => m.productIndex === productIndex)
                : messages;

            if (filteredMessages.length === 0) return;

            const lastMessageId = filteredMessages[filteredMessages.length - 1].id;
            socket.emit('reveal_spoilers', {
                sessionId,
                upToMessageId: lastMessageId,
            });
        }
    }, [socket, sessionId, messages]);

    const revealMySpoilers = useCallback(() => {
        if (messages.length > 0) {
            setRevealedMessageIds((prev) => {
                const newSet = new Set(prev);
                messages.forEach((m) => newSet.add(m.id));
                return newSet;
            });
        }
    }, [messages]);

    useEffect(() => {
        if (!socket) return;

        const handleMessageHistory = (data: MessageHistoryEvent) => {
            setMessages(data.messages);
            if (data.products) {
                // We might want to store products in state if needed, 
                // but they are also in the session data from useSession
            }
        };

        const handleNewMessage = (message: NewMessageEvent) => {
            setMessages((prev) => [...prev, message]);
        };

        const handleMessageDeleted = (data: MessageDeletedEvent) => {
            setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
        };

        const handleMessageUpdated = (data: MessageUpdatedEvent) => {
            setMessages((prev) => prev.map((m) =>
                m.id === data.messageId ? { ...m, content: data.content, tags: data.tags } : m
            ));
        };

        const handleSpoilersRevealed = (data: SpoilersRevealedEvent) => {
            if (data.isGlobal) {
                setGloballyRevealedMessageIds((prev) => {
                    const newSet = new Set(prev);
                    data.messageIds.forEach((id) => newSet.add(id));
                    return newSet;
                });
            } else {
                setRevealedMessageIds((prev) => {
                    const newSet = new Set(prev);
                    data.messageIds.forEach((id) => newSet.add(id));
                    return newSet;
                });
            }
        };

        socket.on('message_history', handleMessageHistory);
        socket.on('new_message', handleNewMessage);
        socket.on('message_deleted', handleMessageDeleted);
        socket.on('message_updated', handleMessageUpdated);
        socket.on('spoilers_revealed', handleSpoilersRevealed);

        return () => {
            socket.off('message_history', handleMessageHistory);
            socket.off('new_message', handleNewMessage);
            socket.off('message_deleted', handleMessageDeleted);
            socket.off('message_updated', handleMessageUpdated);
            socket.off('spoilers_revealed', handleSpoilersRevealed);
        };
    }, [socket]);

    return {
        messages,
        setMessages,
        revealedMessageIds,
        setRevealedMessageIds,
        globallyRevealedMessageIds,
        setGloballyRevealedMessageIds,
        sendMessage,
        deleteMessage,
        editMessage,
        revealAllSpoilers,
        revealMySpoilers,
    };
};
