import React from 'react';
import { User, Archive, ChevronRight, Mail, Shield, LogOut } from 'lucide-react';

interface SettingsSidebarProps {
    currentUser: any;
    sessionsCount: number;
    synthesizedCount: number;
    friendsCount: number;
    onNavigate: (path: string) => void;
    onLogout: () => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
    currentUser,
    sessionsCount,
    synthesizedCount,
    friendsCount,
    onNavigate,
    onLogout,
}) => {
    return (
        <div className="space-y-6">
            <div className="card p-6 md:p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[var(--bg-input)] flex items-center justify-center mb-4 border-2 border-[var(--border-secondary)]">
                    <User size={40} className="text-[var(--text-secondary)] md:size-12" />
                </div>
                <h2 className="heading-lg mb-1">{currentUser?.displayName || 'User'}</h2>
                <p className="text-xs text-[var(--text-secondary)] mb-6">{currentUser?.email}</p>

                <div className="w-full grid grid-cols-3 gap-2 pt-6 border-t border-[var(--border-primary)]">
                    <div>
                        <p className="text-lg md:text-xl font-bold text-orange-500">{sessionsCount}</p>
                        <p className="text-[8px] md:text-[10px] text-[var(--text-muted)] uppercase font-bold">Sessions</p>
                    </div>
                    <div>
                        <p className="text-lg md:text-xl font-bold text-green-500">{synthesizedCount}</p>
                        <p className="text-[8px] md:text-[10px] text-[var(--text-muted)] uppercase font-bold">Synthesized</p>
                    </div>
                    <div>
                        <p className="text-lg md:text-xl font-bold text-blue-500">{friendsCount}</p>
                        <p className="text-[8px] md:text-[10px] text-[var(--text-muted)] uppercase font-bold">Friends</p>
                    </div>
                </div>
            </div>

            <div className="card p-0 overflow-hidden">
                <button
                    onClick={() => onNavigate('/archive')}
                    className="w-full flex items-center gap-3 p-4 hover:bg-[var(--bg-input)]/50 transition-colors text-sm text-[var(--text-secondary)]"
                >
                    <Archive size={16} className="text-[var(--text-secondary)]" />
                    <span>Archived Sessions</span>
                    <ChevronRight size={14} className="ml-auto text-[var(--text-muted)]" />
                </button>
                <button className="w-full flex items-center gap-3 p-4 hover:bg-[var(--bg-input)]/50 transition-colors text-sm text-[var(--text-secondary)] border-t border-[var(--border-primary)]">
                    <Mail size={16} className="text-[var(--text-secondary)]" />
                    <span>Notifications</span>
                </button>
                <button className="w-full flex items-center gap-3 p-4 hover:bg-[var(--bg-input)]/50 transition-colors text-sm text-[var(--text-secondary)] border-t border-[var(--border-primary)]">
                    <Shield size={16} className="text-[var(--text-secondary)]" />
                    <span>Security</span>
                </button>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 p-4 hover:bg-red-900/10 transition-colors text-sm text-red-500 border-t border-[var(--border-primary)]"
                >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
};
