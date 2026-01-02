import { useState, useEffect } from 'react';
import { Archive, ChevronRight, Mail, Shield, LogOut, Edit2, Check, X } from 'lucide-react';
import { UserAvatar } from '../UserAvatar';

interface SettingsSidebarProps {
    currentUser: any;
    sessionsCount: number;
    synthesizedCount: number;
    friendsCount: number;
    onNavigate: (path: string) => void;
    onLogout: () => void;
    onUpdateProfile?: (data: { displayName?: string; useGeneratedAvatar?: boolean }) => Promise<void>;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
    currentUser,
    sessionsCount,
    synthesizedCount,
    friendsCount,
    onNavigate,
    onLogout,
    onUpdateProfile,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(currentUser?.displayName || '');

    useEffect(() => {
        if (currentUser?.displayName) {
            setEditValue(currentUser.displayName);
        }
    }, [currentUser]);

    const handleSave = async () => {
        if (onUpdateProfile && editValue.trim() && editValue !== currentUser?.displayName) {
            await onUpdateProfile({ displayName: editValue.trim() });
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(currentUser?.displayName || '');
        setIsEditing(false);
    };
    return (
        <div className="space-y-6">
            <div className="card p-6 md:p-8 flex flex-col items-center text-center">
                <div className="mb-4">
                    <UserAvatar
                        avatarUrl={currentUser?.avatarUrl}
                        displayName={currentUser?.displayName}
                        userId={currentUser?.id}
                        useGeneratedAvatar={currentUser?.useGeneratedAvatar}
                        size="xl"
                    />
                </div>
                <div className="relative group">
                    {isEditing ? (
                        <div className="flex flex-col items-center gap-2 w-full max-w-[200px]">
                            <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full px-3 py-1 bg-[var(--bg-input)] border border-orange-500 rounded text-center text-lg font-bold focus:outline-none"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSave();
                                    if (e.key === 'Escape') handleCancel();
                                }}
                            />
                            <div className="flex gap-2">
                                <button onClick={handleSave} className="p-1 text-green-500 hover:bg-green-500/10 rounded transition-colors">
                                    <Check size={16} />
                                </button>
                                <button onClick={handleCancel} className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                            <h2 className="heading-lg mb-0">{currentUser?.displayName || 'User'}</h2>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-1 text-[var(--text-muted)] hover:text-orange-500 transition-colors"
                                title="Edit display name"
                            >
                                <Edit2 size={14} />
                            </button>
                        </div>
                    )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-4 mt-1">{currentUser?.email}</p>

                {/* Avatar Toggle */}
                <div className="mb-6">
                    <button
                        onClick={() => onUpdateProfile?.({ useGeneratedAvatar: !currentUser?.useGeneratedAvatar })}
                        className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-300 ${currentUser?.useGeneratedAvatar
                            ? 'bg-orange-500/10 border-orange-500/30 text-orange-500'
                            : 'bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Random Avatar</span>
                        <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${currentUser?.useGeneratedAvatar ? 'bg-orange-500' : 'bg-[var(--bg-input)] border border-[var(--border-primary)]'
                            }`}>
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 ${currentUser?.useGeneratedAvatar ? 'left-4' : 'left-0.5'
                                }`} />
                        </div>
                    </button>
                </div>

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
