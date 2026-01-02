import { User } from 'lucide-react';
import Avatar from 'boring-avatars';

export interface UserAvatarProps {
    avatarUrl?: string | null;
    displayName?: string | null;
    size?: 'sm' | 'md' | 'lg' | 'huge' | 'xl';
    showOnlineStatus?: boolean;
    isOnline?: boolean;
    useGeneratedAvatar?: boolean;
    userId?: string;
}

const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-10 h-10',
    huge: 'w-16 h-16',
    xl: 'w-20 h-20 md:w-24 md:h-24',
};

const pixelSizes = {
    sm: 32,
    md: 36,
    lg: 40,
    huge: 64,
    xl: 96,
};

const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
    huge: 32,
    xl: 40,
};

const indicatorSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    huge: 'w-4 h-4',
    xl: 'w-4 h-4',
};

// Derived colors from name/id to ensure consistency
const getAvatarColors = (seed: string) => {
    const colors = [
        '#f97316', // orange-500
        '#eab308', // yellow-500
        '#84cc16', // lime-500
        '#22c55e', // green-500
        '#06b6d4', // cyan-500
        '#3b82f6', // blue-500
        '#8b5cf6', // violet-500
        '#d946ef', // fuchsia-500
    ];

    // Simple hash to pick 5 colors
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    const result = [];
    for (let i = 0; i < 5; i++) {
        const index = Math.abs((hash + i * 13) % colors.length);
        result.push(colors[index]);
    }
    return result;
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
    useGeneratedAvatar = false,
    userId,
}: UserAvatarProps) {
    const seed = userId || displayName || 'anonymous';
    const colors = getAvatarColors(seed);

    return (
        <div className="relative">
            {useGeneratedAvatar ? (
                <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center bg-[var(--bg-input)]`}>
                    <Avatar
                        size={pixelSizes[size]}
                        name={seed}
                        variant="beam"
                        colors={colors}
                    />
                </div>
            ) : avatarUrl ? (
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
