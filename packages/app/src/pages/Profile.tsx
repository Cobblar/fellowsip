import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Wine, LogOut, ChevronRight, Mail, Shield, Users, UserPlus, Check, X, Archive } from 'lucide-react';
import { api } from '../api/client';
import { useFriends, usePendingRequests, useSendFriendRequest, useAcceptFriendRequest, useRejectFriendRequest, useRemoveFriend, useUpdateAutoMod } from '../api/friends';
import type { Session } from '../types';

export function Profile() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<{ id: string; displayName: string | null; email: string } | null>(null);
    const [friendEmail, setFriendEmail] = useState('');
    const [activeTab, setActiveTab] = useState<'history' | 'friends'>('history');

    const { data: friendsData, isLoading: friendsLoading } = useFriends();
    const { data: pendingData, isLoading: pendingLoading } = usePendingRequests();
    const sendRequest = useSendFriendRequest();
    const acceptRequest = useAcceptFriendRequest();
    const rejectRequest = useRejectFriendRequest();
    const removeFriend = useRemoveFriend();
    const updateAutoMod = useUpdateAutoMod();

    const friends = friendsData?.friends || [];
    const pendingRequests = pendingData?.requests || [];

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const [sessionRes, userRes] = await Promise.all([
                    api.get<{ sessions: Session[] }>('/auth/profile/sessions'),
                    api.get<{ user: { id: string; displayName: string | null; email: string } }>('/auth/session')
                ]);
                setSessions(sessionRes.sessions);
                setUser(userRes.user);
            } catch (error) {
                console.error('Failed to fetch profile data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfileData();
    }, []);

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            window.location.href = import.meta.env.VITE_LANDING_URL || 'http://localhost:4321';
        }
    };

    const handleSendFriendRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!friendEmail.trim()) return;

        try {
            await sendRequest.mutateAsync(friendEmail);
            setFriendEmail('');
        } catch (error) {
            console.error('Failed to send friend request:', error);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-[var(--text-secondary)]">Loading profile...</div>;
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="heading-xl mb-2">Account Settings</h1>
                <p className="text-sm text-[var(--text-secondary)]">Manage your profile, friends, and tasting history.</p>
            </div>

            <div className="grid grid-cols-3 gap-8">
                {/* Left: User Info */}
                <div className="space-y-6">
                    <div className="card p-8 flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full bg-[var(--bg-input)] flex items-center justify-center mb-4 border-2 border-[var(--border-secondary)]">
                            <User size={48} className="text-[var(--text-secondary)]" />
                        </div>
                        <h2 className="heading-lg mb-1">{user?.displayName || 'User'}</h2>
                        <p className="text-xs text-[var(--text-secondary)] mb-6">{user?.email}</p>

                        <div className="w-full grid grid-cols-3 gap-2 pt-6 border-t border-[var(--border-primary)]">
                            <div>
                                <p className="text-xl font-bold text-orange-500">{sessions.length}</p>
                                <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Sessions</p>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-green-500">{sessions.filter(s => s.summaryId).length}</p>
                                <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Synthesized</p>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-blue-500">{friends.length}</p>
                                <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Friends</p>
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
                <div className="col-span-2 space-y-6">
                    {/* Tab Navigation */}
                    <div className="flex gap-4 border-b border-[var(--border-primary)]">
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'history'
                                ? 'text-orange-500 border-b-2 border-orange-500'
                                : 'text-[var(--text-secondary)] hover:text-white'
                                }`}
                        >
                            Recent History
                        </button>
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'friends'
                                ? 'text-orange-500 border-b-2 border-orange-500'
                                : 'text-[var(--text-secondary)] hover:text-white'
                                }`}
                        >
                            <Users size={14} />
                            Friends
                            {pendingRequests.length > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {pendingRequests.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <div className="card">
                            <div className="space-y-4">
                                {sessions.slice(0, 10).map((session) => (
                                    <div
                                        key={session.id}
                                        onClick={() => navigate(session.summaryId ? `/session/${session.id}/summary` : `/session/${session.id}`)}
                                        className="flex items-center justify-between p-4 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg hover:border-gray-600 cursor-pointer transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-[var(--bg-input)] rounded flex items-center justify-center text-orange-500">
                                                <Wine size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-white">{session.name}</h4>
                                                <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={10} />
                                                        {new Date(session.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <span>{session.productType || 'Tasting'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {session.summaryId ? (
                                                <span className="text-[10px] text-green-500 font-bold uppercase tracking-tighter">Synthesized</span>
                                            ) : (
                                                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter">In Progress</span>
                                            )}
                                            <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]" />
                                        </div>
                                    </div>
                                ))}
                                {sessions.length === 0 && (
                                    <div className="text-center py-12 text-[var(--text-muted)] text-sm italic">
                                        No sessions recorded yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Friends Tab */}
                    {activeTab === 'friends' && (
                        <div className="space-y-6">
                            {/* Add Friend Form */}
                            <div className="card">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4">Add Friend</h3>
                                <form onSubmit={handleSendFriendRequest} className="flex gap-3">
                                    <input
                                        type="email"
                                        placeholder="Enter friend's email address"
                                        value={friendEmail}
                                        onChange={(e) => setFriendEmail(e.target.value)}
                                        className="flex-1 px-4 py-2 bg-[var(--bg-input)] border-[var(--border-primary)] text-sm"
                                    />
                                    <button
                                        type="submit"
                                        disabled={sendRequest.isPending || !friendEmail.trim()}
                                        className="btn-orange disabled:opacity-50"
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

                            {/* Pending Requests */}
                            {pendingRequests.length > 0 && (
                                <div className="card">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4">
                                        Pending Requests ({pendingRequests.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {pendingRequests.map((request) => (
                                            <div
                                                key={request.id}
                                                className="flex items-center justify-between p-4 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-[var(--bg-input)] rounded-full flex items-center justify-center">
                                                        <User size={18} className="text-[var(--text-secondary)]" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-[var(--text-primary)]">
                                                            {request.sender?.displayName || request.sender?.email}
                                                        </p>
                                                        <p className="text-xs text-[var(--text-secondary)]">{request.sender?.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
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

                            {/* Friends List */}
                            <div className="card">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4">
                                    Your Friends ({friends.length})
                                </h3>
                                {friends.length > 0 ? (
                                    <div className="space-y-3">
                                        {friends.map((item) => (
                                            <div
                                                key={item.friendshipId}
                                                className="flex items-center justify-between p-4 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-[var(--bg-input)] rounded-full flex items-center justify-center overflow-hidden">
                                                        {item.friend.avatarUrl ? (
                                                            <img src={item.friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={18} className="text-[var(--text-secondary)]" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-[var(--text-primary)]">
                                                            {item.friend.displayName || item.friend.email}
                                                        </p>
                                                        <p className="text-xs text-[var(--text-secondary)]">{item.friend.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
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
                                                        className="text-xs text-[var(--text-secondary)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-[var(--text-muted)] text-sm italic">
                                        No friends yet. Send a friend request to get started!
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
