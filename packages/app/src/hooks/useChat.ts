import { useState, useEffect, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import type {
  Message,
  ActiveUser,
  MessageHistoryEvent,
  ActiveUsersEvent,
  NewMessageEvent,
  UserJoinedEvent,
  UserLeftEvent,
  ErrorEvent,
} from '../types';

interface UseChatOptions {
  sessionId: string;
  socket: Socket | null;
}

export function useChat({ sessionId, socket }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Join session
  useEffect(() => {
    if (!socket || !sessionId) return;

    socket.emit('join_session', { sessionId });
    setIsConnected(true);

    // Message history handler
    const handleMessageHistory = (data: MessageHistoryEvent) => {
      setMessages(data.messages);
    };

    // Active users handler
    const handleActiveUsers = (data: ActiveUsersEvent) => {
      setActiveUsers(data.users);
    };

    // New message handler
    const handleNewMessage = (message: NewMessageEvent) => {
      setMessages((prev) => [...prev, message]);
    };

    // User joined handler
    const handleUserJoined = (data: UserJoinedEvent) => {
      console.log('User joined:', data.user.displayName);
    };

    // User left handler
    const handleUserLeft = (data: UserLeftEvent) => {
      console.log('User left:', data.userId);
    };

    // Error handler
    const handleError = (data: ErrorEvent) => {
      setError(data.message);
      console.error('Socket error:', data.message);
    };

    // Register event listeners
    socket.on('message_history', handleMessageHistory);
    socket.on('active_users', handleActiveUsers);
    socket.on('new_message', handleNewMessage);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('error', handleError);

    // Cleanup
    return () => {
      socket.emit('leave_session', { sessionId });
      socket.off('message_history', handleMessageHistory);
      socket.off('active_users', handleActiveUsers);
      socket.off('new_message', handleNewMessage);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('error', handleError);
      setIsConnected(false);
    };
  }, [socket, sessionId]);

  // Send message
  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !sessionId || !content.trim()) return;

      socket.emit('send_message', {
        sessionId,
        content: content.trim(),
      });
    },
    [socket, sessionId]
  );

  return {
    messages,
    activeUsers,
    isConnected,
    error,
    sendMessage,
  };
}
