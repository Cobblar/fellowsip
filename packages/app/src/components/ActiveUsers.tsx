import { Users, Crown } from 'lucide-react';
import type { ActiveUser } from '../types';

interface ActiveUsersProps {
  users: ActiveUser[];
  hostId?: string;
}

export function ActiveUsers({ users, hostId }: ActiveUsersProps) {
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <Users size={16} className="text-[var(--text-muted)]" />
        <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Participants ({users.length})
        </h3>
      </div>

      <div className="space-y-2">
        {users.map((user) => {
          const isHost = user.userId === hostId;
          return (
            <div
              key={user.socketId}
              className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${isHost ? 'bg-[var(--accent-primary)]/10' : 'hover:bg-[var(--bg-tertiary)]'
                }`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${isHost
                  ? 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                }`}>
                {(user.displayName || 'A')[0].toUpperCase()}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`text-sm truncate ${isHost ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'
                    }`}>
                    {user.displayName || 'Anonymous'}
                  </span>
                  {isHost && <Crown size={12} className="text-[var(--accent-primary)] flex-shrink-0" />}
                </div>
              </div>

              {/* Online indicator */}
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            </div>
          );
        })}

        {users.length === 0 && (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">
            No one else is here yet
          </p>
        )}
      </div>
    </div>
  );
}
