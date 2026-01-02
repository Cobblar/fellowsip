import { Zap, Info, X, Ban, VolumeX, Check } from 'lucide-react';
import { UserAvatar } from '../UserAvatar';

interface HostControlsProps {
    isHost: boolean;
    isSessionEnded: boolean;
    isEnding: boolean;
    onEndSession: (shouldAnalyze: boolean) => void;
    showEndModal: boolean;
    setShowEndModal: (show: boolean) => void;
    joinRequests: any[];
    onApproveJoinRequest: (requestId: string) => void;
    onRejectJoinRequest: (requestId: string) => void;
    isActionsOpen: boolean;
    setIsActionsOpen: (open: boolean) => void;
    showStreamInput: boolean;
    setShowStreamInput: (show: boolean) => void;
    streamInputValue: string;
    setStreamInputValue: (value: string) => void;
    onUpdateLivestream: () => void;
    livestreamUrl: string | null;
    revealAllSpoilers: () => void;
    setShowSpoilerDefaults: (show: boolean) => void;
    injectDebugHistory: () => void;
    currentUserId: string | null;
    confirmAction: { type: 'kick' | 'mute'; userId: string; displayName: string | null } | null;
    setConfirmAction: (action: { type: 'kick' | 'mute'; userId: string; displayName: string | null } | null) => void;
    onMuteUser: (userId: string, erase: boolean) => void;
    onKickUser: (userId: string, erase: boolean) => void;
    showManageBans: boolean;
    setShowManageBans: (show: boolean) => void;
    mutedUsers: any[];
    kickedUsers: any[];
    onUnmuteUser: (userId: string) => void;
    onUnkickUser: (userId: string) => void;
}

export const EndSessionModal: React.FC<Pick<HostControlsProps, 'showEndModal' | 'setShowEndModal' | 'onEndSession'>> = ({
    showEndModal,
    setShowEndModal,
    onEndSession,
}) => {
    if (!showEndModal) return null;

    return (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="card w-full max-w-md p-8 border-orange-500/30 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                        <Zap size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">End Tasting Session?</h3>
                        <p className="text-sm text-[var(--text-secondary)]">Choose how you'd like to wrap up this session.</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => onEndSession(true)}
                        className="w-full btn-orange flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-2">
                            <Zap size={16} />
                            <span>End & Synthesize Profile</span>
                        </div>
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded uppercase font-bold">Recommended</span>
                    </button>

                    <button
                        onClick={() => onEndSession(false)}
                        className="w-full py-3 px-4 bg-[var(--bg-input)] hover:opacity-90 text-[var(--text-primary)] border border-[var(--border-primary)] rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Info size={16} className="text-[var(--text-secondary)]" />
                        End Session Only
                    </button>

                    <button
                        onClick={() => setShowEndModal(false)}
                        className="w-full py-3 px-4 bg-transparent border border-[var(--border-primary)] hover:bg-[var(--bg-main)] text-[var(--text-secondary)] rounded-md text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export const JoinRequestsPanel: React.FC<Pick<HostControlsProps, 'joinRequests' | 'onApproveJoinRequest' | 'onRejectJoinRequest'>> = ({
    joinRequests,
    onApproveJoinRequest,
    onRejectJoinRequest,
}) => {
    if (joinRequests.length === 0) return null;

    return (
        <div className="p-4 border-t border-[var(--border-primary)]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-yellow-500 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                Join Requests ({joinRequests.length})
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {joinRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-2 rounded-md bg-yellow-500/5 border border-yellow-500/20">
                        <div className="flex items-center gap-2 min-w-0">
                            <UserAvatar
                                avatarUrl={request.requester?.avatarUrl}
                                displayName={request.requester?.displayName}
                                userId={request.requester?.id}
                                useGeneratedAvatar={request.requester?.useGeneratedAvatar}
                                size="sm"
                            />
                            <span className="text-xs text-[var(--text-primary)] truncate">
                                {request.requester?.displayName || request.requester?.email || 'User'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                                onClick={() => onApproveJoinRequest(request.id)}
                                className="p-1 bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 transition-colors"
                                title="Approve"
                            >
                                <Check size={12} />
                            </button>
                            <button
                                onClick={() => onRejectJoinRequest(request.id)}
                                className="p-1 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors"
                                title="Reject"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const ConfirmationDialog: React.FC<Pick<HostControlsProps, 'confirmAction' | 'setConfirmAction' | 'onMuteUser' | 'onKickUser'>> = ({
    confirmAction,
    setConfirmAction,
    onMuteUser,
    onKickUser,
}) => {
    if (!confirmAction) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                    {confirmAction.type === 'kick' ? 'Kick User' : 'Mute User'}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Are you sure you want to {confirmAction.type === 'kick' ? 'kick' : 'mute'}{' '}
                    <span className="font-semibold text-[var(--text-primary)]">
                        {confirmAction.displayName || 'this user'}
                    </span>
                    {confirmAction.type === 'kick'
                        ? '? They will be removed from the session and cannot rejoin.'
                        : '? They will not be able to send messages.'}
                </p>
                <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                        <button
                            onClick={() => setConfirmAction(null)}
                            className="flex-1 py-2 px-4 bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg text-sm font-medium hover:bg-[var(--bg-main)] transition-colors"
                        >
                            Cancel
                        </button>
                        {confirmAction.type === 'kick' ? (
                            <button
                                onClick={() => {
                                    onKickUser(confirmAction.userId, true);
                                    setConfirmAction(null);
                                }}
                                className="flex-1 py-2 px-4 rounded-lg text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
                            >
                                Kick & Erase
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    onMuteUser(confirmAction.userId, false);
                                    setConfirmAction(null);
                                }}
                                className="flex-1 py-2 px-4 rounded-lg text-sm font-bold bg-yellow-500 text-black hover:bg-yellow-400 transition-colors"
                            >
                                Mute Only
                            </button>
                        )}
                    </div>
                    {confirmAction.type === 'mute' && (
                        <button
                            onClick={() => {
                                onMuteUser(confirmAction.userId, true);
                                setConfirmAction(null);
                            }}
                            className="w-full py-2 px-4 rounded-lg text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                            Mute & Erase Messages
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export const ManageBansModal: React.FC<Pick<HostControlsProps, 'showManageBans' | 'setShowManageBans' | 'mutedUsers' | 'kickedUsers' | 'onUnmuteUser' | 'onUnkickUser' | 'isHost'>> = ({
    showManageBans,
    setShowManageBans,
    mutedUsers,
    kickedUsers,
    onUnmuteUser,
    onUnkickUser,
    isHost,
}) => {
    if (!showManageBans) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-6 max-w-md w-full mx-4 shadow-xl max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Manage Bans</h3>
                    <button
                        onClick={() => setShowManageBans(false)}
                        className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="mb-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-500 mb-3 flex items-center gap-2">
                        <VolumeX size={12} />
                        Muted Users ({mutedUsers.length})
                    </h4>
                    {mutedUsers.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] italic">No muted users</p>
                    ) : (
                        <div className="space-y-2">
                            {mutedUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg"
                                >
                                    <span className="text-sm text-[var(--text-primary)]">
                                        {user.displayName || 'Unknown User'}
                                    </span>
                                    <button
                                        onClick={() => onUnmuteUser(user.id)}
                                        className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 transition-colors"
                                    >
                                        Unmute
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-3 flex items-center gap-2">
                        <Ban size={12} />
                        Kicked Users ({kickedUsers.length})
                    </h4>
                    {kickedUsers.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] italic">No kicked users</p>
                    ) : (
                        <div className="space-y-2">
                            {kickedUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-2 bg-red-500/5 border border-red-500/20 rounded-lg"
                                >
                                    <span className="text-sm text-[var(--text-primary)]">
                                        {user.displayName || 'Unknown User'}
                                    </span>
                                    {isHost && (
                                        <button
                                            onClick={() => onUnkickUser(user.id)}
                                            className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 transition-colors"
                                        >
                                            Unkick
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {!isHost && kickedUsers.length > 0 && (
                        <p className="text-[10px] text-[var(--text-muted)] mt-2 italic">
                            Only the host can unkick users
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
