import { Users, UserPlus, User, Check, X, ChevronRight } from 'lucide-react';
import { useFriendsLogic } from '../hooks/useFriendsLogic';

export function Friends() {
    const friendsLogic = useFriendsLogic();

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="heading-xl flex items-center gap-3">
                    <Users size={28} className="text-orange-500" />
                    Friends
                </h1>
                <button
                    onClick={() => friendsLogic.setIsAddingFriend(!friendsLogic.isAddingFriend)}
                    className={`p-2 rounded-lg transition-colors ${friendsLogic.isAddingFriend
                        ? 'bg-orange-500 text-white'
                        : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                >
                    <UserPlus size={20} />
                </button>
            </div>

            {friendsLogic.isAddingFriend && (
                <div className="card mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4">Add New Friend</h2>
                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="Friend's email..."
                                value={friendsLogic.friendEmail}
                                onChange={(e) => friendsLogic.setFriendEmail(e.target.value)}
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-orange-500 transition-colors"
                                autoFocus
                            />
                            {friendsLogic.sendFriendRequest.isPending && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => friendsLogic.friendEmail && friendsLogic.handleSendFriendRequest(friendsLogic.friendEmail)}
                                disabled={!friendsLogic.friendEmail || friendsLogic.sendFriendRequest.isPending}
                                className="flex-1 btn-orange py-3"
                            >
                                Send Request
                            </button>
                            <button
                                onClick={() => friendsLogic.setIsAddingFriend(false)}
                                className="px-6 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] font-bold rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                        {friendsLogic.sendFriendRequest.error && (
                            <p className="text-sm text-red-500">
                                {(friendsLogic.sendFriendRequest.error as any)?.message || 'Failed to send request'}
                            </p>
                        )}
                        {friendsLogic.sendFriendRequest.isSuccess && (
                            <p className="text-sm text-green-500">
                                Request sent successfully!
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-8">
                {/* Pending Requests */}
                {friendsLogic.pendingRequests.length > 0 && (
                    <section>
                        <button
                            onClick={() => friendsLogic.setShowPendingRequests(!friendsLogic.showPendingRequests)}
                            className="w-full flex items-center justify-between p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl hover:bg-orange-500/20 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <UserPlus size={20} className="text-orange-500" />
                                <span className="font-bold text-orange-500">
                                    {friendsLogic.pendingRequests.length} Pending Request{friendsLogic.pendingRequests.length > 1 ? 's' : ''}
                                </span>
                            </div>
                            <ChevronRight size={18} className={`text-orange-500 transition-transform ${friendsLogic.showPendingRequests ? 'rotate-90' : ''}`} />
                        </button>

                        {friendsLogic.showPendingRequests && (
                            <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                {friendsLogic.pendingRequests.map((request) => (
                                    <div
                                        key={request.id}
                                        className="flex items-center justify-between p-4 bg-[var(--bg-sidebar)] border border-[var(--border-primary)] rounded-xl"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 bg-[var(--bg-input)] rounded-full flex items-center justify-center shrink-0">
                                                <User size={20} className="text-[var(--text-secondary)]" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-[var(--text-primary)] truncate">
                                                    {request.sender?.displayName || request.sender?.email}
                                                </p>
                                                <p className="text-xs text-[var(--text-secondary)]">Wants to be your friend</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-4">
                                            <button
                                                onClick={() => friendsLogic.acceptRequest.mutate(request.id)}
                                                disabled={friendsLogic.acceptRequest.isPending}
                                                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                onClick={() => friendsLogic.rejectRequest.mutate(request.id)}
                                                disabled={friendsLogic.rejectRequest.isPending}
                                                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Friends List */}
                {friendsLogic.friendsLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                ) : friendsLogic.friends.length > 0 ? (
                    <div className="space-y-6">
                        {friendsLogic.activeFriends.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest text-green-500 mb-4 px-1">
                                    In Session ({friendsLogic.activeFriends.length})
                                </h2>
                                <div className="space-y-3">
                                    {friendsLogic.activeFriends.map((item) => (
                                        <div
                                            key={item.friendshipId}
                                            className="flex items-center gap-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20 hover:border-green-500/40 transition-all cursor-pointer group"
                                            onClick={() => friendsLogic.handleFriendClick(item.friend.id)}
                                        >
                                            <div className="relative">
                                                {item.friend.avatarUrl ? (
                                                    <img src={item.friend.avatarUrl} alt="" className="w-12 h-12 rounded-full" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                                        <User size={24} className="text-green-500" />
                                                    </div>
                                                )}
                                                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[var(--bg-main)] rounded-full animate-pulse"></span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-[var(--text-primary)] truncate">
                                                    {item.friend.displayName || item.friend.email}
                                                </p>
                                                <p className="text-xs text-green-500 font-medium">Currently in a session</p>
                                            </div>
                                            <ChevronRight size={18} className="text-[var(--text-muted)] group-hover:text-green-500 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {friendsLogic.inactiveFriends.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 px-1">
                                    Offline ({friendsLogic.inactiveFriends.length})
                                </h2>
                                <div className="space-y-3">
                                    {friendsLogic.inactiveFriends.map((item) => (
                                        <div
                                            key={item.friendshipId}
                                            className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border-primary)] hover:border-[var(--border-hover)] transition-all cursor-pointer group"
                                            onClick={() => friendsLogic.handleFriendClick(item.friend.id)}
                                        >
                                            <div className="relative">
                                                {item.friend.avatarUrl ? (
                                                    <img src={item.friend.avatarUrl} alt="" className="w-12 h-12 rounded-full opacity-60" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-[var(--bg-input)] flex items-center justify-center">
                                                        <User size={24} className="text-[var(--text-secondary)]" />
                                                    </div>
                                                )}
                                                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-gray-600 border-2 border-[var(--bg-main)] rounded-full"></span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-[var(--text-secondary)] truncate">
                                                    {item.friend.displayName || item.friend.email}
                                                </p>
                                            </div>
                                            <ChevronRight size={18} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-[var(--bg-sidebar)] rounded-2xl border border-dashed border-[var(--border-primary)]">
                        <Users size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
                        <h3 className="font-bold text-[var(--text-primary)] mb-2">No friends yet</h3>
                        <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto">
                            Add friends to see their tasting sessions and share your cellar.
                        </p>
                        <button
                            onClick={() => friendsLogic.setIsAddingFriend(true)}
                            className="mt-6 text-orange-500 font-bold hover:underline"
                        >
                            Add your first friend
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
