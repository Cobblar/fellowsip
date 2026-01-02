import { UserPlus, ChevronRight, Check, X, Shield } from 'lucide-react';
import { UserAvatar } from '../UserAvatar';

interface FriendsTabProps {
    friends: any[];
    pendingRequests: any[];
    showPendingRequests: boolean;
    setShowPendingRequests: (show: boolean) => void;
    friendEmail: string;
    setFriendEmail: (email: string) => void;
    onSendRequest: (e: React.FormEvent) => void;
    onAcceptRequest: (id: string) => void;
    onRejectRequest: (id: string) => void;
    onRemoveFriend: (id: string) => void;
    onUpdateAutoMod: (data: { friendshipId: string; autoMod: boolean }) => void;
    onProfileClick: (userId: string) => void;
    sendRequestStatus: { isPending: boolean; isSuccess: boolean; isError: boolean; error: any };
    acceptRequestPending: boolean;
    rejectRequestPending: boolean;
    removeFriendPending: boolean;
    updateAutoModPending: boolean;
}

export const FriendsTab: React.FC<FriendsTabProps> = ({
    friends,
    pendingRequests,
    showPendingRequests,
    setShowPendingRequests,
    friendEmail,
    setFriendEmail,
    onSendRequest,
    onAcceptRequest,
    onRejectRequest,
    onRemoveFriend,
    onUpdateAutoMod,
    onProfileClick,
    sendRequestStatus,
    acceptRequestPending,
    rejectRequestPending,
    removeFriendPending,
    updateAutoModPending,
}) => {
    return (
        <div className="space-y-6">
            {/* Pending Requests Button */}
            {pendingRequests.length > 0 && (
                <button
                    onClick={() => setShowPendingRequests(!showPendingRequests)}
                    className="w-full card p-4 flex items-center justify-between hover:border-orange-500/50 transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                            <UserPlus size={20} className="text-orange-500" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-[var(--text-primary)]">
                                {pendingRequests.length} Friend Request{pendingRequests.length > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">
                                Tap to {showPendingRequests ? 'hide' : 'view'} requests
                            </p>
                        </div>
                    </div>
                    <ChevronRight size={18} className={`text-[var(--text-muted)] transition-transform ${showPendingRequests ? 'rotate-90' : ''}`} />
                </button>
            )}

            {/* Expanded Pending Requests */}
            {showPendingRequests && pendingRequests.length > 0 && (
                <div className="card p-4 md:p-6 border-orange-500/30">
                    <div className="space-y-3">
                        {pendingRequests.map((request) => (
                            <div
                                key={request.id}
                                className="flex items-center justify-between p-3 md:p-4 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <UserAvatar
                                        avatarUrl={request.sender?.avatarUrl}
                                        displayName={request.sender?.displayName}
                                        userId={request.sender?.id}
                                        useGeneratedAvatar={request.sender?.useGeneratedAvatar}
                                        size="md"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                            {request.sender?.displayName || request.sender?.email}
                                        </p>
                                        <p className="text-xs text-[var(--text-secondary)] truncate">{request.sender?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                    <button
                                        onClick={() => onAcceptRequest(request.id)}
                                        disabled={acceptRequestPending}
                                        className="p-2 bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 transition-colors"
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        onClick={() => onRejectRequest(request.id)}
                                        disabled={rejectRequestPending}
                                        className="p-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Friend Form */}
            <div className="card p-4 md:p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4">Add Friend</h3>
                <form onSubmit={onSendRequest} className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="email"
                        placeholder="Enter friend's email address"
                        value={friendEmail}
                        onChange={(e) => setFriendEmail(e.target.value)}
                        className="flex-1 px-4 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg text-sm focus:outline-none focus:border-orange-500 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={sendRequestStatus.isPending || !friendEmail.trim()}
                        className="btn-orange disabled:opacity-50 justify-center"
                    >
                        <UserPlus size={16} />
                        {sendRequestStatus.isPending ? 'Sending...' : 'Send Request'}
                    </button>
                </form>
                {sendRequestStatus.isSuccess && (
                    <p className="text-green-500 text-xs mt-2">Friend request sent!</p>
                )}
                {sendRequestStatus.isError && (
                    <p className="text-red-500 text-xs mt-2">
                        {sendRequestStatus.error?.data?.error || 'Failed to send request'}
                    </p>
                )}
            </div>

            {/* Friends List */}
            <div className="card p-4 md:p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4">
                    Your Friends ({friends.length})
                </h3>
                {friends.length > 0 ? (
                    <div className="space-y-3">
                        {friends.map((item) => (
                            <div
                                key={item.friendshipId}
                                className="flex items-center justify-between p-3 md:p-4 border border-transparent hover:bg-[var(--bg-input)] hover:border-[var(--border-primary)] hover:scale-[1.01] active:scale-[0.99] rounded-lg group transition-all"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div
                                        onClick={() => onProfileClick(item.friend.id)}
                                        className="cursor-pointer hover:scale-105 transition-transform"
                                    >
                                        <UserAvatar
                                            avatarUrl={item.friend.avatarUrl}
                                            displayName={item.friend.displayName}
                                            userId={item.friend.id}
                                            useGeneratedAvatar={item.friend.useGeneratedAvatar}
                                            size="md"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <p
                                            onClick={() => onProfileClick(item.friend.id)}
                                            className="text-sm font-medium text-[var(--text-primary)] truncate cursor-pointer hover:text-orange-500 transition-colors"
                                        >
                                            {item.friend.displayName || item.friend.email}
                                        </p>
                                        <p className="text-xs text-[var(--text-secondary)] truncate">{item.friend.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-2">
                                    <button
                                        onClick={() => onUpdateAutoMod({
                                            friendshipId: item.friendshipId,
                                            autoMod: !item.autoMod
                                        })}
                                        disabled={updateAutoModPending}
                                        className={`p-2 rounded transition-colors ${item.autoMod
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-blue-400 hover:bg-blue-500/10'
                                            }`}
                                        title={item.autoMod ? 'Auto-mod enabled (click to disable)' : 'Enable auto-mod (auto-promote to moderator when joining your sessions)'}
                                    >
                                        <Shield size={14} />
                                    </button>
                                    <button
                                        onClick={() => onRemoveFriend(item.friendshipId)}
                                        disabled={removeFriendPending}
                                        className="text-xs text-[var(--text-secondary)] hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-[var(--text-muted)] text-sm italic">
                        No friends yet.
                    </div>
                )}
            </div>
        </div>
    );
};
