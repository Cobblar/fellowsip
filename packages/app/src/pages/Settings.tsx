import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronRight, Mail, Shield, Users, UserPlus, Check, X, Archive, Settings as SettingsIcon } from 'lucide-react';
import { api } from '../api/client';
import { useFriends, usePendingRequests, useSendFriendRequest, useAcceptFriendRequest, useRejectFriendRequest, useRemoveFriend, useUpdateAutoMod } from '../api/friends';
import { useCurrentUser, useUpdateProfile } from '../api/auth';
import type { Session } from '../types';

export function Settings() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [friendEmail, setFriendEmail] = useState('');
    const [activeTab, setActiveTab] = useState<'friends' | 'settings'>('friends');
    const [showPendingRequests, setShowPendingRequests] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState('');

    const { data: friendsData } = useFriends();
    const { data: pendingData } = usePendingRequests();
    const sendRequest = useSendFriendRequest();
    const acceptRequest = useAcceptFriendRequest();
    const rejectRequest = useRejectFriendRequest();
    const removeFriend = useRemoveFriend();
    const updateAutoMod = useUpdateAutoMod();
    const { data: currentUserData } = useCurrentUser();
    const updateProfile = useUpdateProfile();

    const currentUser = currentUserData?.user;

    const friends = friendsData?.friends || [];
    const pendingRequests = pendingData?.requests || [];

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const sessionRes = await api.get<{ sessions: Session[] }>('/auth/profile/sessions');
                setSessions(sessionRes.sessions);
            } catch (error) {
                console.error('Failed to fetch sessions:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSessions();
    }, []);

    useEffect(() => {
        if (currentUser?.displayName) {
            setNewDisplayName(currentUser.displayName);
        }
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            window.location.href = import.meta.env.VITE_LANDING_URL || 'http://localhost:4321';
        }
    };

    const handleUpdateDisplayName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDisplayName.trim()) return;

        try {
            await updateProfile.mutateAsync({ displayName: newDisplayName.trim() });
        } catch (error) {
            console.error('Failed to update display name:', error);
        }
    };

    const handleSendFriendRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!friendEmail.trim()) return;

        try {
            await sendRequest.mutateAsync(friendEmail.trim());
            setFriendEmail('');
        } catch (error) {
            console.error('Failed to send friend request:', error);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-[var(--text-secondary)]">Loading profile...</div>;
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="heading-xl mb-2">Account Settings</h1>
                <p className="text-sm text-[var(--text-secondary)]">Manage your display name, friends, and account security.</p>
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
                {/* Left: User Info */}
                <div className="space-y-6">
                    <div className="card p-6 md:p-8 flex flex-col items-center text-center">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[var(--bg-input)] flex items-center justify-center mb-4 border-2 border-[var(--border-secondary)]">
                            <User size={40} className="text-[var(--text-secondary)] md:size-12" />
                        </div>
                        <h2 className="heading-lg mb-1">{currentUser?.displayName || 'User'}</h2>
                        <p className="text-xs text-[var(--text-secondary)] mb-6">{currentUser?.email}</p>

                        <div className="w-full grid grid-cols-3 gap-2 pt-6 border-t border-[var(--border-primary)]">
                            <div>
                                <p className="text-lg md:text-xl font-bold text-orange-500">{sessions.length}</p>
                                <p className="text-[8px] md:text-[10px] text-[var(--text-muted)] uppercase font-bold">Sessions</p>
                            </div>
                            <div>
                                <p className="text-lg md:text-xl font-bold text-green-500">{sessions.filter(s => s.summaryId).length}</p>
                                <p className="text-[8px] md:text-[10px] text-[var(--text-muted)] uppercase font-bold">Synthesized</p>
                            </div>
                            <div>
                                <p className="text-lg md:text-xl font-bold text-blue-500">{friends.length}</p>
                                <p className="text-[8px] md:text-[10px] text-[var(--text-muted)] uppercase font-bold">Friends</p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-0 overflow-hidden">
                        <button
                            onClick={() => navigate('/archive')}
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
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 p-4 hover:bg-red-900/10 transition-colors text-sm text-red-500 border-t border-[var(--border-primary)]"
                        >
                            <LogOut size={16} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>

                {/* Right: Tabs */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tab Navigation */}
                    <div className="flex gap-4 border-b border-[var(--border-primary)] overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'friends'
                                ? 'text-orange-500 border-b-2 border-orange-500'
                                : 'text-[var(--text-secondary)] hover:text-white'
                                }`}
                        >
                            <Users size={14} />
                            Friends
                            {pendingRequests.length > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2">
                                    {pendingRequests.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'settings'
                                ? 'text-orange-500 border-b-2 border-orange-500'
                                : 'text-[var(--text-secondary)] hover:text-white'
                                }`}
                        >
                            <SettingsIcon size={14} />
                            Settings
                        </button>
                    </div>


                    {/* Friends Tab */}
                    {activeTab === 'friends' && (
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
                                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-[var(--bg-input)] rounded-full flex items-center justify-center shrink-0">
                                                        <User size={16} className="text-[var(--text-secondary)] md:size-18" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                                            {request.sender?.displayName || request.sender?.email}
                                                        </p>
                                                        <p className="text-xs text-[var(--text-secondary)] truncate">{request.sender?.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                                    <button
                                                        onClick={() => acceptRequest.mutate(request.id)}
                                                        disabled={acceptRequest.isPending}
                                                        className="p-2 bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 transition-colors"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => rejectRequest.mutate(request.id)}
                                                        disabled={rejectRequest.isPending}
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
                                <form onSubmit={handleSendFriendRequest} className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="email"
                                        placeholder="Enter friend's email address"
                                        value={friendEmail}
                                        onChange={(e) => setFriendEmail(e.target.value)}
                                        className="flex-1 px-4 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg text-sm focus:outline-none focus:border-orange-500 transition-colors"
                                    />
                                    <button
                                        type="submit"
                                        disabled={sendRequest.isPending || !friendEmail.trim()}
                                        className="btn-orange disabled:opacity-50 justify-center"
                                    >
                                        <UserPlus size={16} />
                                        {sendRequest.isPending ? 'Sending...' : 'Send Request'}
                                    </button>
                                </form>
                                {sendRequest.isSuccess && (
                                    <p className="text-green-500 text-xs mt-2">Friend request sent!</p>
                                )}
                                {sendRequest.isError && (
                                    <p className="text-red-500 text-xs mt-2">
                                        {(sendRequest.error as any)?.data?.error || 'Failed to send request'}
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
                                                className="flex items-center justify-between p-3 md:p-4 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg group"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div
                                                        onClick={() => navigate(`/profile/${item.friend.id}/public`)}
                                                        className="w-8 h-8 md:w-10 md:h-10 bg-[var(--bg-input)] rounded-full flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-orange-500 transition-all"
                                                    >
                                                        {item.friend.avatarUrl ? (
                                                            <img src={item.friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={16} className="text-[var(--text-secondary)] md:size-18" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p
                                                            onClick={() => navigate(`/profile/${item.friend.id}/public`)}
                                                            className="text-sm font-medium text-[var(--text-primary)] truncate cursor-pointer hover:text-orange-500 transition-colors"
                                                        >
                                                            {item.friend.displayName || item.friend.email}
                                                        </p>
                                                        <p className="text-xs text-[var(--text-secondary)] truncate">{item.friend.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-2">
                                                    <button
                                                        onClick={() => updateAutoMod.mutate({
                                                            friendshipId: item.friendshipId,
                                                            autoMod: !item.autoMod
                                                        })}
                                                        disabled={updateAutoMod.isPending}
                                                        className={`p-2 rounded transition-colors ${item.autoMod
                                                            ? 'bg-blue-500/20 text-blue-400'
                                                            : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-blue-400 hover:bg-blue-500/10'
                                                            }`}
                                                        title={item.autoMod ? 'Auto-mod enabled (click to disable)' : 'Enable auto-mod (auto-promote to moderator when joining your sessions)'}
                                                    >
                                                        <Shield size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => removeFriend.mutate(item.friendshipId)}
                                                        disabled={removeFriend.isPending}
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
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="card p-4 md:p-6">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-6">Profile Settings</h3>

                            <form onSubmit={handleUpdateDisplayName} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                                        Display Name
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input
                                            type="text"
                                            placeholder="Enter your display name"
                                            value={newDisplayName}
                                            onChange={(e) => setNewDisplayName(e.target.value)}
                                            className="flex-1 px-4 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg text-sm focus:outline-none focus:border-orange-500 transition-colors"
                                        />
                                        <button
                                            type="submit"
                                            disabled={updateProfile.isPending || !newDisplayName.trim() || newDisplayName === currentUser?.displayName}
                                            className="btn-orange disabled:opacity-50 justify-center"
                                        >
                                            {updateProfile.isPending ? 'Updating...' : 'Update Name'}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-[var(--text-muted)] mt-2 italic">
                                        This is how other users will see you in chat rooms and friend lists.
                                    </p>
                                </div>




                                {updateProfile.isSuccess && (
                                    <p className="text-green-500 text-xs">Profile updated successfully!</p>
                                )}
                                {updateProfile.isError && (
                                    <p className="text-red-500 text-xs">
                                        {(updateProfile.error as any)?.data?.error || 'Failed to update profile'}
                                    </p>
                                )}
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
