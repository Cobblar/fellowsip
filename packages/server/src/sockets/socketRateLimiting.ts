import type { Socket } from 'socket.io';

// Rate limiting state
const userMessageTimestamps = new Map<string, number[]>();
const userBlockExpiration = new Map<string, number>();
const userBlockDuration = new Map<string, number>();
const INITIAL_BLOCK_DURATION = 60 * 1000; // 1 minute

export interface RateLimitResult {
    isLimited: boolean;
    message?: string;
    remainingSeconds?: number;
}

export function checkRateLimit(userId: string, _socket: Socket): RateLimitResult {
    const now = Date.now();

    // Check if user is blocked
    const blockExpires = userBlockExpiration.get(userId) || 0;
    if (now < blockExpires) {
        const remainingSeconds = Math.ceil((blockExpires - now) / 1000);
        return {
            isLimited: true,
            message: `You are sending messages too fast. Please wait ${remainingSeconds} seconds.`,
            remainingSeconds
        };
    }

    // Get recent messages
    let timestamps = userMessageTimestamps.get(userId) || [];
    // Filter out messages older than 1 minute
    timestamps = timestamps.filter(t => now - t < 60000);

    if (timestamps.length >= 15) {
        // Rate limit exceeded
        const currentDuration = userBlockDuration.get(userId) || INITIAL_BLOCK_DURATION;
        const nextDuration = currentDuration * 2; // Exponential backoff

        userBlockExpiration.set(userId, now + currentDuration);
        userBlockDuration.set(userId, nextDuration);

        const remainingSeconds = currentDuration / 1000;
        return {
            isLimited: true,
            message: `Rate limit exceeded. You are blocked for ${remainingSeconds} seconds.`,
            remainingSeconds
        };
    }

    // Add current timestamp
    timestamps.push(now);
    userMessageTimestamps.set(userId, timestamps);

    // Reset block duration if user behaves
    if (timestamps.length === 1) {
        userBlockDuration.set(userId, INITIAL_BLOCK_DURATION);
    }

    return { isLimited: false };
}
