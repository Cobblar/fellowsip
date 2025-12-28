import { useNavigate } from 'react-router-dom';
import { Users, User, Clock, ChevronRight, PlayCircle, Wine, Calendar, UserPlus, LogIn, Plus, X } from 'lucide-react';
import { useFriends, useFriendsSessions, useMyJoinRequests, useRequestToJoin } from '../api/friends';
import { useAllSummaries, useUserSessions } from '../api/sessions';
import { useState } from 'react';
import { getProductIcon, getProductColor } from '../utils/productIcons';

export function Home() {
    const navigate = useNavigate();
    const { data: friendsData, isLoading: friendsLoading } = useFriends();
    const { data: friendsSessionsData } = useFriendsSessions();
    const { data: myJoinRequestsData } = useMyJoinRequests();
    const { data: summariesData } = useAllSummaries();
    const { data: sessionsData } = useUserSessions();
    const requestToJoin = useRequestToJoin();

    const [requestedSessions, setRequestedSessions] = useState<Set<string>>(new Set());
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const friends = friendsData?.friends || [];
    const friendsSessions = friendsSessionsData?.sessions || [];
    const myJoinRequests = myJoinRequestsData?.requests || [];
    const summaries = summariesData?.summaries || [];
    const allSessions = sessionsData?.sessions || [];

    const activeSessions = allSessions.filter(s => s.status === 'active');

    // Get IDs of friends who are currently in an active session (hosting)
    const activeFriendIds = new Set(friendsSessions.map(s => s.host?.id).filter(Boolean));

    // Split friends into active and inactive
    const activeFriends = friends.filter(f => activeFriendIds.has(f.friend.id));
    const inactiveFriends = friends.filter(f => !activeFriendIds.has(f.friend.id));

    // Helper to get join request status for a session
    const getJoinStatus = (sessionId: string): 'none' | 'pending' | 'approved' | 'rejected' => {
        const request = myJoinRequests.find(r => r.sessionId === sessionId);
        if (request) return request.status;
        if (requestedSessions.has(sessionId)) return 'pending';
        return 'none';
    };

    const handleRequestToJoin = async (sessionId: string) => {
        try {
            await requestToJoin.mutateAsync(sessionId);
            setRequestedSessions(prev => new Set(prev).add(sessionId));
        } catch (error) {
            console.error('Failed to request join:', error);
        }
    };

    return (
        <div className="h-full flex overflow-hidden relative">
            {/* Mobile Sidebar Toggle */}
            <button
                onClick={() => setIsSidebarOpen(true)}
                className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-600 transition-colors md:hidden"
            >
                <Users size={24} />
            </button>

            {/* Sidebar Overlay (Mobile) */}
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Left Sidebar: Friends List */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''} w-[280px] bg-[var(--bg-sidebar)] border-r border-[var(--border-primary)] flex flex-col overflow-hidden`}>
                <div className="p-6 border-b border-[var(--border-primary)] flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                        <Users size={14} />
                        Friends ({friends.length})
                    </h2>
                    <button onClick={() => setIsSidebarOpen(false)} className="text-[var(--text-secondary)] hover:text-white md:hidden">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {friendsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                        </div>
                    ) : friends.length > 0 ? (
                        <div className="space-y-4">
                            {/* Active Friends (In Session) */}
                            {activeFriends.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-500 mb-2 px-1">
                                        In Session ({activeFriends.length})
                                    </p>
                                    <div className="space-y-2">
                                        {activeFriends.map((item) => (
                                            <div
                                                key={item.friendshipId}
                                                className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20 hover:border-green-500/40 transition-colors cursor-pointer"
                                                onClick={() => {
                                                    const session = friendsSessions.find(s => s.host?.id === item.friend.id);
                                                    if (session) {
                                                        navigate(`/session/${session.id}`);
                                                        setIsSidebarOpen(false);
                                                    }
                                                }}
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

                            {/* Inactive Friends */}
                            {inactiveFriends.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 px-1">
                                        Offline ({inactiveFriends.length})
                                    </p>
                                    <div className="space-y-2">
                                        {inactiveFriends.map((item) => (
                                            <div
                                                key={item.friendshipId}
                                                className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-main)]/30 border border-[var(--border-primary)]/50 hover:border-[var(--border-secondary)] transition-colors"
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
                            <button
                                onClick={() => { navigate('/profile'); setIsSidebarOpen(false); }}
                                className="text-xs text-orange-500 hover:underline mt-2"
                            >
                                Add friends
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Welcome Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <h1 className="heading-xl">Welcome Back</h1>
                        <button
                            onClick={() => navigate('/create')}
                            className="btn-orange w-full md:w-auto justify-center"
                        >
                            <Plus size={16} />
                            New Session
                        </button>
                    </div>

                    {/* Active Sessions Section */}
                    <section className="min-h-[200px] md:h-[320px] md:overflow-y-auto custom-scrollbar md:pr-2">
                        <div className="min-h-full flex flex-col">
                            {activeSessions.length > 0 && (
                                <div className="mb-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">My Active Sessions</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {activeSessions.map((session) => {
                                            const ProductIcon = getProductIcon(session.productType);
                                            const colorClass = getProductColor(session.productType);
                                            return (
                                                <div
                                                    key={session.id}
                                                    onClick={() => navigate(`/session/${session.id}`)}
                                                    className="card border-green-500/20 hover:border-green-500/50 transition-all cursor-pointer group bg-green-500/5 p-5"
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 bg-[var(--bg-input)] rounded flex items-center justify-center ${colorClass}`}>
                                                                <ProductIcon size={20} />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-[var(--text-primary)] group-hover:text-white">{session.name}</h3>
                                                                <p className="text-xs text-[var(--text-secondary)]">{session.productType || 'Tasting'}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-1 rounded font-bold uppercase">Live</span>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-3 border-t border-[var(--border-primary)]/50">
                                                        <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                                                            <Clock size={12} />
                                                            <span>Started {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                                                            Join <ChevronRight size={14} />
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {friendsSessions.length > 0 && (
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Users size={14} className="text-blue-500" />
                                        <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">Friend's Sessions</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {friendsSessions.map((session) => {
                                            const status = getJoinStatus(session.id);
                                            const ProductIcon = getProductIcon(session.productType);
                                            const colorClass = getProductColor(session.productType);
                                            return (
                                                <div
                                                    key={session.id}
                                                    className="card border-blue-500/20 hover:border-blue-500/50 transition-all bg-blue-500/5 p-5"
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 bg-[var(--bg-input)] rounded flex items-center justify-center ${colorClass}`}>
                                                                <ProductIcon size={20} />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-[var(--text-primary)]">{session.name}</h3>
                                                                <p className="text-xs text-[var(--text-secondary)]">
                                                                    Hosted by {session.host?.displayName || 'Friend'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] bg-blue-500/20 text-blue-500 px-2 py-1 rounded font-bold uppercase">Live</span>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-3 border-t border-[var(--border-primary)]/50">
                                                        <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                                                            <Clock size={12} />
                                                            <span>Started {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        {status === 'approved' ? (
                                                            <button
                                                                onClick={() => navigate(`/session/${session.id}`)}
                                                                className="text-xs font-bold text-green-500 hover:text-green-400 flex items-center gap-1 animate-pulse-once"
                                                            >
                                                                <LogIn size={12} className="animate-bounce-in" />
                                                                Join Session
                                                            </button>
                                                        ) : status === 'pending' ? (
                                                            <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                                                                Request sent
                                                            </span>
                                                        ) : status === 'rejected' ? (
                                                            <span className="text-xs text-red-400">Request declined</span>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleRequestToJoin(session.id)}
                                                                disabled={requestToJoin.isPending}
                                                                className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
                                                            >
                                                                <UserPlus size={12} />
                                                                Request to Join
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {activeSessions.length === 0 && friendsSessions.length === 0 && (
                                <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-main)]/30 rounded-lg border border-dashed border-[var(--border-primary)] py-8 px-4 text-center">
                                    <PlayCircle size={48} className="text-[var(--text-muted)] mb-4" />
                                    <h3 className="text-xl font-bold text-[var(--text-secondary)] mb-2">No Active Sessions</h3>
                                    <p className="text-sm text-[var(--text-secondary)]">Start a new tasting session or wait for a friend to go live.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Recent Summaries */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">Recent Tastings</h2>
                            <button
                                onClick={() => navigate('/my-cellar')}
                                className="text-xs text-orange-500 hover:underline flex items-center gap-1"
                            >
                                View all <ChevronRight size={14} />
                            </button>
                        </div>
                        {summaries.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {summaries.slice(0, 3).map((item) => {
                                    const ProductIcon = getProductIcon(item.session.productType);
                                    const colorClass = getProductColor(item.session.productType);
                                    return (
                                        <div
                                            key={item.session.id}
                                            onClick={() => navigate(`/session/${item.session.id}/summary`)}
                                            className="card hover:border-gray-600 transition-all cursor-pointer group p-5"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 bg-[var(--bg-input)] rounded flex items-center justify-center ${colorClass}`}>
                                                        <ProductIcon size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-bold text-[var(--text-primary)] group-hover:text-white text-sm">
                                                                {item.session.productName || item.session.name}
                                                            </h3>
                                                            {item.session.startedAt && (new Date().getTime() - new Date(item.session.startedAt).getTime() < 24 * 60 * 60 * 1000) && (
                                                                <span className="text-[8px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">New</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-[var(--text-secondary)]">
                                                            {item.session.productName ? item.session.name : (item.session.productType || 'Tasting')}
                                                        </p>
                                                    </div>
                                                </div>
                                                {item.summary?.metadata?.rating && (
                                                    <div className="text-right">
                                                        <span className="text-lg font-bold text-orange-500">{item.summary.metadata.rating}</span>
                                                        <p className="text-[8px] text-[var(--text-muted)] uppercase font-bold">Score</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-1 mb-3 min-h-[40px]">
                                                {item.summary.nose && (
                                                    <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1">
                                                        <span className="text-[var(--text-muted)] uppercase font-bold mr-1">Nose:</span> {item.summary.nose}
                                                    </p>
                                                )}
                                                {item.summary.palate && (
                                                    <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1">
                                                        <span className="text-[var(--text-muted)] uppercase font-bold mr-1">Palate:</span> {item.summary.palate}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] pt-3 border-t border-[var(--border-primary)]/50">
                                                <Calendar size={12} />
                                                <span>{item.session?.startedAt ? new Date(item.session.startedAt).toLocaleDateString() : ''}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-[var(--bg-main)]/30 rounded-lg border border-dashed border-[var(--border-primary)] px-4">
                                <Wine size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
                                <p className="text-sm text-[var(--text-secondary)]">No summaries yet. Complete a tasting session to see your notes here.</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
