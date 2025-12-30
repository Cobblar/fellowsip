import React from 'react';
import { Users, MoreVertical, X, PlayCircle, CheckCircle, User, Crown, Shield, ShieldOff, Volume2, VolumeX, Ban, Check, Star } from 'lucide-react';

interface ParticipantListProps {
    activeUsers: any[];
    moderators: string[];
    effectiveHostId: string | undefined;
    currentUserId: string | null;
    isHost: boolean;
    canModerate: boolean;
    readyCheckActive: boolean;
    readyUsers: Set<string>;
    onStartReadyCheck: () => void;
    onEndReadyCheck: () => void;
    onMarkReady: () => void;
    onMarkUnready: () => void;
    onGetBannedUsers: () => void;
    onShowManageBans: (show: boolean) => void;
    onMakeModerator: (userId: string) => void;
    onUnmodUser: (userId: string) => void;
    onTransferHost: (userId: string) => void;
    onMuteUser: (userId: string, displayName: string | null) => void;
    onKickUser: (userId: string, displayName: string | null) => void;
    mutedUsers: any[];
    unmuteUser: (userId: string) => void;
    isTastersMenuOpen: boolean;
    setIsTastersMenuOpen: (open: boolean) => void;
    tastersMenuRef: React.RefObject<HTMLDivElement>;
    expandedActionUserId: string | null;
    setExpandedActionUserId: (userId: string | null) => void;
    isTransferring: boolean;
    onCloseSidebar: () => void;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
    activeUsers,
    moderators,
    effectiveHostId,
    currentUserId,
    isHost,
    canModerate,
    readyCheckActive,
    readyUsers,
    onStartReadyCheck,
    onEndReadyCheck,
    onMarkReady,
    onMarkUnready,
    onGetBannedUsers,
    onShowManageBans,
    onMakeModerator,
    onUnmodUser,
    onTransferHost,
    onMuteUser,
    onKickUser,
    mutedUsers,
    unmuteUser,
    isTastersMenuOpen,
    setIsTastersMenuOpen,
    tastersMenuRef,
    expandedActionUserId,
    setExpandedActionUserId,
    isTransferring,
    onCloseSidebar,
}) => {
    return (
        <div className="p-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                    <Users size={12} />
                    Active Tasters
                </h3>
                <div className="flex items-center gap-2">
                    {isHost && (
                        <div className="relative" ref={tastersMenuRef}>
                            <button
                                onClick={() => setIsTastersMenuOpen(!isTastersMenuOpen)}
                                className={`p-1 rounded transition-all ${isTastersMenuOpen ? 'bg-[var(--bg-input)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            >
                                <MoreVertical size={14} />
                            </button>
                            {isTastersMenuOpen && (
                                <div className="absolute right-0 mt-1 w-44 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-1">
                                        {readyCheckActive ? (
                                            <button
                                                onClick={() => {
                                                    onEndReadyCheck();
                                                    setIsTastersMenuOpen(false);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                            >
                                                <X size={14} />
                                                End Ready Check
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    onStartReadyCheck();
                                                    setIsTastersMenuOpen(false);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-green-400 hover:bg-green-500/10 rounded-md transition-colors"
                                            >
                                                <PlayCircle size={14} />
                                                Start Ready Check
                                            </button>
                                        )}
                                        <div className="border-t border-[var(--border-primary)] my-1" />
                                        <button
                                            onClick={() => {
                                                onGetBannedUsers();
                                                onShowManageBans(true);
                                                setIsTastersMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-input)] rounded-md transition-colors"
                                        >
                                            <Ban size={14} />
                                            Manage Bans
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <button onClick={onCloseSidebar} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] md:hidden">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {readyCheckActive && (
                <div className="mb-4 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">Ready Check Active</span>
                        <span className="text-xs font-bold text-green-400">
                            {readyUsers.size}/{activeUsers.length} ({activeUsers.length > 0 ? Math.round((readyUsers.size / activeUsers.length) * 100) : 0}%)
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--bg-input)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{ width: `${activeUsers.length > 0 ? (readyUsers.size / activeUsers.length) * 100 : 0}%` }}
                        />
                    </div>
                    {currentUserId && !readyUsers.has(currentUserId) && (
                        <button
                            onClick={onMarkReady}
                            className="w-full mt-3 py-2 px-3 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={14} />
                            Mark Ready
                        </button>
                    )}
                    {currentUserId && readyUsers.has(currentUserId) && (
                        <div className="flex gap-2 mt-3">
                            <div className="flex-1 py-2 px-3 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-2">
                                <CheckCircle size={14} />
                                You're Ready!
                            </div>
                            <button
                                onClick={onMarkUnready}
                                className="px-3 py-2 bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-bold transition-colors"
                                title="Unready"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {isHost && activeUsers.length > 0 && (readyUsers.size / activeUsers.length) >= 0.95 && (
                        <button
                            onClick={onEndReadyCheck}
                            className="w-full mt-2 py-1.5 px-3 bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg text-[10px] font-bold transition-colors border border-[var(--border-primary)]"
                        >
                            Close Ready Check
                        </button>
                    )}
                </div>
            )}

            <div className="space-y-2">
                {activeUsers.map((user) => {
                    const isUserHost = user.userId === effectiveHostId;
                    const isUserMod = moderators.includes(user.userId);
                    const canTransfer = isHost && !isUserHost && user.userId !== currentUserId;
                    const canMakeMod = isHost && !isUserHost && !isUserMod && user.userId !== currentUserId;
                    const isUserReady = readyUsers.has(user.userId);
                    return (
                        <div
                            key={user.socketId}
                            className={`flex items-center gap-2 p-2 rounded-md border group ${isUserHost
                                ? 'bg-orange-500/5 border-orange-500/30'
                                : isUserMod
                                    ? 'bg-blue-500/5 border-blue-500/30'
                                    : readyCheckActive && isUserReady
                                        ? 'bg-green-500/5 border-green-500/30'
                                        : 'bg-[var(--bg-main)]/30 border-[var(--border-primary)]/50'
                                }`}
                        >
                            <div className="relative">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.displayName || ''} className="w-7 h-7 rounded-full" />
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-[var(--bg-input)] flex items-center justify-center">
                                        <User size={14} className="text-[var(--text-secondary)]" />
                                    </div>
                                )}
                                {readyCheckActive && isUserReady ? (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[var(--bg-sidebar)] rounded-full flex items-center justify-center">
                                        <Check size={6} className="text-white" />
                                    </span>
                                ) : (
                                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-[var(--bg-sidebar)] rounded-full"></span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                    <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                                        {user.displayName || 'Anonymous'}
                                    </span>
                                    {isUserHost && (
                                        <Crown size={10} className="text-orange-500 flex-shrink-0" />
                                    )}
                                    {isUserMod && !isUserHost && (
                                        <Shield size={10} className="text-blue-400 flex-shrink-0" />
                                    )}
                                </div>
                                {isUserHost && (
                                    <p className="text-[9px] text-orange-500/70">Host</p>
                                )}
                                {isUserMod && !isUserHost && (
                                    <p className="text-[9px] text-blue-400/70">Moderator</p>
                                )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {(canMakeMod || canTransfer || (canModerate && user.userId !== currentUserId && !isUserHost) || (isHost && isUserMod && !isUserHost && user.userId !== currentUserId)) && (
                                    <div className="relative flex items-center">
                                        {expandedActionUserId === user.userId ? (
                                            <>
                                                {canMakeMod && (
                                                    <button
                                                        onClick={() => { onMakeModerator(user.userId); setExpandedActionUserId(null); }}
                                                        className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-all"
                                                        title="Make Moderator"
                                                    >
                                                        <Shield size={10} />
                                                    </button>
                                                )}
                                                {isHost && isUserMod && !isUserHost && user.userId !== currentUserId && (
                                                    <button
                                                        onClick={() => { onUnmodUser(user.userId); setExpandedActionUserId(null); }}
                                                        className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-all"
                                                        title="Remove Moderator"
                                                    >
                                                        <ShieldOff size={10} />
                                                    </button>
                                                )}
                                                {canTransfer && (
                                                    <button
                                                        onClick={() => { onTransferHost(user.userId); setExpandedActionUserId(null); }}
                                                        disabled={isTransferring}
                                                        className="text-[9px] px-1.5 py-0.5 bg-orange-500/10 text-orange-500 rounded hover:bg-orange-500/20 transition-all"
                                                        title="Make Host"
                                                    >
                                                        <Crown size={10} />
                                                    </button>
                                                )}
                                                {canModerate && user.userId !== currentUserId && !isUserHost && (
                                                    <>
                                                        {mutedUsers.some(u => u.id === user.userId) ? (
                                                            <button
                                                                onClick={() => { unmuteUser(user.userId); setExpandedActionUserId(null); }}
                                                                className="text-[9px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 transition-all"
                                                                title="Unmute"
                                                            >
                                                                <Volume2 size={10} />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => { onMuteUser(user.userId, user.displayName); setExpandedActionUserId(null); }}
                                                                className="text-[9px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 rounded hover:bg-yellow-500/20 transition-all"
                                                                title="Mute"
                                                            >
                                                                <VolumeX size={10} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => { onKickUser(user.userId, user.displayName); setExpandedActionUserId(null); }}
                                                            className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-all"
                                                            title="Kick"
                                                        >
                                                            <Ban size={10} />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => setExpandedActionUserId(null)}
                                                    className="text-[9px] px-1 py-0.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-all"
                                                    title="Close"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => setExpandedActionUserId(user.userId)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded transition-all"
                                                title="Actions"
                                            >
                                                <MoreHorizontal size={12} />
                                            </button>
                                        )}
                                    </div>
                                )}
                                {user.rating && (
                                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-500/10 rounded text-[10px] font-bold text-orange-500">
                                        <Star size={8} fill="currentColor" />
                                        {user.rating}
                                    </div>
                                )}
                                {readyCheckActive && isUserReady && (
                                    <span className="text-base">✅</span>
                                )}
                            </div>
                        </div>
                    );
                })}
                {activeUsers.length === 0 && (
                    <p className="text-[10px] text-[var(--text-muted)] italic">No other tasters...</p>
                )}
            </div>
        </div>
    );
};

const MoreHorizontal: React.FC<{ size: number }> = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
    </svg>
);
