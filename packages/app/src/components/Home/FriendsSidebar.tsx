import React from 'react';
import { Users, UserPlus, X, User, Check, ChevronRight } from 'lucide-react';

interface FriendsSidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    friends: any[];
    friendsLoading: boolean;
    isAddingFriend: boolean;
    setIsAddingFriend: (adding: boolean) => void;
    friendEmail: string;
    setFriendEmail: (email: string) => void;
    onSendFriendRequest: (email: string) => void;
    sendFriendRequestPending: boolean;
    sendFriendRequestError: any;
    sendFriendRequestSuccess: boolean;
    pendingRequests: any[];
    showPendingRequests: boolean;
    setShowPendingRequests: (show: boolean) => void;
    onAcceptRequest: (id: string) => void;
    onRejectRequest: (id: string) => void;
    acceptRequestPending: boolean;
    rejectRequestPending: boolean;
    activeFriends: any[];
    inactiveFriends: any[];
    onFriendClick: (friendId: string) => void;
}

export const FriendsSidebar: React.FC<FriendsSidebarProps> = ({
    isSidebarOpen,
    setIsSidebarOpen,
    friends,
    friendsLoading,
    isAddingFriend,
    setIsAddingFriend,
    friendEmail,
    setFriendEmail,
    onSendFriendRequest,
    sendFriendRequestPending,
    sendFriendRequestError,
    sendFriendRequestSuccess,
    pendingRequests,
    showPendingRequests,
    setShowPendingRequests,
    onAcceptRequest,
    onRejectRequest,
    acceptRequestPending,
    rejectRequestPending,
    activeFriends,
    inactiveFriends,
    onFriendClick,
}) => {
    return (
        <>
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''} w-[280px] bg-[var(--bg-sidebar)] border-r border-[var(--border-primary)] flex flex-col overflow-hidden`}>
                <div className="p-4 border-b border-[var(--border-primary)]">
                    <div className={`flex items-center justify-between ${isAddingFriend ? 'mb-4' : ''}`}>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                            <Users size={14} />
                            Friends ({friends.length})
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsAddingFriend(!isAddingFriend)}
                                className={`p-1.5 rounded-lg transition-colors ${isAddingFriend
                                    ? 'bg-orange-500 text-white'
                                    : friends.length === 0
                                        ? 'bg-orange-500 text-white animate-pulse'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                                    }`}
                                title="Add Friend"
                            >
                                <UserPlus size={16} />
                            </button>
                            <button onClick={() => setIsSidebarOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] md:hidden">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {isAddingFriend && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="Friend's email..."
                                    value={friendEmail}
                                    onChange={(e) => setFriendEmail(e.target.value)}
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg py-2 px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-orange-500 transition-colors"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && friendEmail) {
                                            onSendFriendRequest(friendEmail);
                                        }
                                        if (e.key === 'Escape') {
                                            setIsAddingFriend(false);
                                        }
                                    }}
                                />
                                {sendFriendRequestPending && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-500"></div>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => friendEmail && onSendFriendRequest(friendEmail)}
                                    disabled={!friendEmail || sendFriendRequestPending}
                                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-2 rounded-lg transition-colors"
                                >
                                    Add Friend
                                </button>
                                <button
                                    onClick={() => setIsAddingFriend(false)}
                                    className="px-3 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] text-xs font-bold py-2 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                            {sendFriendRequestError && (
                                <p className="text-[10px] text-red-500 px-1">
                                    {sendFriendRequestError?.message || 'Failed to send request'}
                                </p>
                            )}
                            {sendFriendRequestSuccess && (
                                <p className="text-[10px] text-green-500 px-1">
                                    Request sent!
                                </p>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {pendingRequests.length > 0 && (
                        <div className="mb-4">
                            <button
                                onClick={() => setShowPendingRequests(!showPendingRequests)}
                                className="w-full flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg hover:bg-orange-500/20 transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <UserPlus size={16} className="text-orange-500" />
                                    <span className="text-sm font-medium text-orange-500">
                                        {pendingRequests.length} Friend Request{pendingRequests.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                                <ChevronRight size={14} className={`text-orange-500 transition-transform ${showPendingRequests ? 'rotate-90' : ''}`} />
                            </button>
                            {showPendingRequests && (
                                <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {pendingRequests.map((request) => (
                                        <div
                                            key={request.id}
                                            className="flex items-center justify-between p-2 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-7 h-7 bg-[var(--bg-input)] rounded-full flex items-center justify-center shrink-0">
                                                    <User size={12} className="text-[var(--text-secondary)]" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                                                        {request.sender?.displayName || request.sender?.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0 ml-2">
                                                <button
                                                    onClick={() => onAcceptRequest(request.id)}
                                                    disabled={acceptRequestPending}
                                                    className="p-1.5 bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 transition-colors"
                                                >
                                                    <Check size={12} />
                                                </button>
                                                <button
                                                    onClick={() => onRejectRequest(request.id)}
                                                    disabled={rejectRequestPending}
                                                    className="p-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {friendsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                        </div>
                    ) : friends.length > 0 ? (
                        <div className="space-y-4">
                            {activeFriends.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-500 mb-2 px-1">
                                        In Session ({activeFriends.length})
                                    </p>
                                    <div className="space-y-2">
                                        {activeFriends.map((item) => (
                                            <div
                                                key={item.friendshipId}
                                                className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:bg-green-500/10 hover:border-green-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
                                                onClick={() => onFriendClick(item.friend.id)}
                                            >
                                                <div className="relative">
                                                    {item.friend.avatarUrl ? (
                                                        <img src={item.friend.avatarUrl} alt="" className="w-9 h-9 rounded-full" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-[var(--bg-input)] flex items-center justify-center">
                                                            <User size={16} className="text-[var(--text-secondary)]" />
                                                        </div>
                                                    )}
                                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[var(--bg-sidebar)] rounded-full animate-pulse"></span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                                        {item.friend.displayName || item.friend.email}
                                                    </p>
                                                    <p className="text-[10px] text-green-500">In session</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {inactiveFriends.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 px-1">
                                        Offline ({inactiveFriends.length})
                                    </p>
                                    <div className="space-y-2">
                                        {inactiveFriends.map((item) => (
                                            <div
                                                key={item.friendshipId}
                                                className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:bg-[var(--bg-hover)] hover:border-[var(--border-hover)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
                                            >
                                                <div className="relative">
                                                    {item.friend.avatarUrl ? (
                                                        <img src={item.friend.avatarUrl} alt="" className="w-9 h-9 rounded-full opacity-60" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-[var(--bg-input)] flex items-center justify-center">
                                                            <User size={16} className="text-[var(--text-secondary)]" />
                                                        </div>
                                                    )}
                                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-gray-600 border-2 border-[var(--bg-sidebar)] rounded-full"></span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-[var(--text-secondary)] truncate">
                                                        {item.friend.displayName || item.friend.email}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <User size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
                            <p className="text-sm text-[var(--text-secondary)]">No friends yet</p>
                        </div>
                    )}
                </div>

            </aside>
        </>
    );
};
