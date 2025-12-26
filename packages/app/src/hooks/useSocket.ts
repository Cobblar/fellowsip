import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

// Singleton socket instance to share across components
let globalSocket: Socket | null = null;

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(globalSocket);
  const initialized = useRef(false);

  useEffect(() => {
    // Only initialize once across the entire app
    if (initialized.current) return;
    initialized.current = true;

    // Reuse existing socket if available
    if (globalSocket) {
      setSocket(globalSocket);
      return;
    }

    // Create socket connection with credentials (cookies)
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
    });

    globalSocket = newSocket;

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setSocket(newSocket); // Trigger re-render when connected
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    newSocket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    // Cleanup on unmount (don't disconnect - singleton)
    return () => {
      // Don't disconnect the global socket on component unmount
    };
  }, []);

  return socket;
}

