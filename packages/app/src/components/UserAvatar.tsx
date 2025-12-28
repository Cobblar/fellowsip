import { User } from 'lucide-react';

export interface UserAvatarProps {
    avatarUrl?: string | null;
    displayName?: string | null;
    size?: 'sm' | 'md' | 'lg';
    showOnlineStatus?: boolean;
    isOnline?: boolean;
}

const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-10 h-10',
};

const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
};

const indicatorSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
};

/**
 * Reusable user avatar component with optional online status indicator.
 * Handles fallback to initials/icon when no image is available.
 */
export function UserAvatar({
    avatarUrl,
    displayName,
    size = 'md',
    showOnlineStatus = false,
    isOnline = false,
}: UserAvatarProps) {
    return (
        <div className="relative">
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={displayName || ''}
                    className={`${sizeClasses[size]} rounded-full ${!isOnline && showOnlineStatus ? 'opacity-60' : ''}`}
                />
            ) : (
                <div className={`${sizeClasses[size]} rounded-full bg-[var(--bg-input)] flex items-center justify-center`}>
                    <User size={iconSizes[size]} className="text-[var(--text-secondary)]" />
                </div>
            )}
            {showOnlineStatus && (
                <span
                    className={`absolute bottom-0 right-0 ${indicatorSizes[size]} ${isOnline ? 'bg-green-500' : 'bg-gray-600'
                        } border-2 border-[var(--bg-sidebar)] rounded-full ${isOnline ? 'animate-pulse' : ''}`}
                />
            )}
        </div>
    );
}
