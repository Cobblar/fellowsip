import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Clock, ChevronRight, ChevronDown, PlayCircle, Plus, Users, UserPlus, LogIn, Archive } from 'lucide-react';
import { useAllSummaries, useUserSessions, useArchiveSession } from '../api/sessions';
import { useFriendsSessions, useRequestToJoin, useMyJoinRequests } from '../api/friends';
import { getProductIcon, getProductColor } from '../utils/productIcons';

export function Summaries() {
    const navigate = useNavigate();
    const { data: summariesData, isLoading: summariesLoading } = useAllSummaries();
    const { data: sessionsData, isLoading: sessionsLoading } = useUserSessions();
    const { data: friendsSessionsData, isLoading: friendsSessionsLoading } = useFriendsSessions();
    const { data: myJoinRequestsData } = useMyJoinRequests();
    const requestToJoin = useRequestToJoin();
    const archiveSession = useArchiveSession();

    const [searchQuery, setSearchQuery] = useState('');
    const [showPreviousSessions, setShowPreviousSessions] = useState(false);
    const [requestedSessions, setRequestedSessions] = useState<Set<string>>(new Set());

    const summaries = summariesData?.summaries || [];
    const allSessions = sessionsData?.sessions || [];
    const friendsSessions = friendsSessionsData?.sessions || [];
    const myJoinRequests = myJoinRequestsData?.requests || [];

    const [joinSessionId, setJoinSessionId] = useState('');
    const [showJoinInput, setShowJoinInput] = useState(false);

    // Helper to get join request status for a session
    const getJoinStatus = (sessionId: string): 'none' | 'pending' | 'approved' | 'rejected' => {
        // Check server-side status first (this is the source of truth)
        const request = myJoinRequests.find(r => r.sessionId === sessionId);
        if (request) return request.status;
        // Fall back to local state for immediate feedback before first poll completes
        if (requestedSessions.has(sessionId)) return 'pending';
        return 'none';
    };

    const activeSessions = useMemo(() => {
        return allSessions.filter(s =>
            s.status === 'active' &&
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allSessions, searchQuery]);

    const previousSummaries = useMemo(() => {
        // Get all sessions that are not active and not archived
        const endedSessions = allSessions.filter(s => s.status === 'ended');

        // Map them to include summary data if available
        return endedSessions
            .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(session => {
                const summary = summaries.find(s => s.session.id === session.id);
                return {
                    session,
                    summary: summary?.summary || null
                };
            });
    }, [allSessions, summaries, searchQuery]);

    const filteredFriendsSessions = useMemo(() => {
        return friendsSessions.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [friendsSessions, searchQuery]);

    const handleRequestToJoin = async (sessionId: string) => {
        try {
            await requestToJoin.mutateAsync(sessionId);
            setRequestedSessions(prev => new Set(prev).add(sessionId));
        } catch (error) {
            console.error('Failed to request join:', error);
        }
    };

    if (summariesLoading || sessionsLoading || friendsSessionsLoading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    const handleJoinById = () => {
        if (joinSessionId.trim()) {
            navigate(`/join/${joinSessionId.trim()}`);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header with New Session Button */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="heading-xl">Sessions</h1>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                        <input
                            type="text"
                            placeholder="Search sessions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-[var(--bg-input)] border-[var(--border-primary)] text-sm w-64"
                        />
                    </div>
                    {showJoinInput ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Paste session ID..."
                                value={joinSessionId}
                                onChange={(e) => setJoinSessionId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleJoinById()}
                                className="px-3 py-2 bg-[var(--bg-input)] border-[var(--border-primary)] text-sm w-48 font-mono"
                                autoFocus
                            />
                            <button
                                onClick={handleJoinById}
                                disabled={!joinSessionId.trim()}
                                className="btn-outline text-sm py-1.5"
                            >
                                Join
                            </button>
                            <button
                                onClick={() => { setShowJoinInput(false); setJoinSessionId(''); }}
                                className="text-[var(--text-secondary)] hover:text-[var(--text-secondary)] text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowJoinInput(true)}
                            className="btn-outline"
                        >
                            Join by ID
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/create')}
                        className="btn-orange"
                    >
                        <Plus size={16} />
                        New Session
                    </button>
                </div>
            </div>

            {/* My Active Sessions Section */}
            {activeSessions.length > 0 && (
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">My Active Sessions</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeSessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => navigate(`/session/${session.id}`)}
                                className="card border-green-500/20 hover:border-green-500/50 transition-all cursor-pointer group bg-green-500/5"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-500/10 rounded flex items-center justify-center text-green-500">
                                            <PlayCircle size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[var(--text-primary)] group-hover:text-white transition-colors">{session.name}</h3>
                                            <p className="text-xs text-[var(--text-secondary)]">{session.productType || 'Tasting'}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-1 rounded font-bold uppercase tracking-wider">Live</span>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] mb-6">
                                    This session is currently active. Join the chat to record your tasting notes.
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t border-[var(--border-primary)]/50">
                                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                                        <Clock size={12} />
                                        <span>Started {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <button className="text-xs font-bold text-green-500 group-hover:underline flex items-center gap-1">
                                        Join Chat <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Friend's Sessions Section */}
            {filteredFriendsSessions.length > 0 && (
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                        <Users size={14} className="text-blue-500" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">Friend's Sessions</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFriendsSessions.map((session) => (
                            <div
                                key={session.id}
                                className="card border-blue-500/20 hover:border-blue-500/50 transition-all bg-blue-500/5"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-500/10 rounded flex items-center justify-center text-blue-500">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[var(--text-primary)]">{session.name}</h3>
                                            <p className="text-xs text-[var(--text-secondary)]">
                                                Hosted by {session.host?.displayName || 'Friend'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] bg-blue-500/20 text-blue-500 px-2 py-1 rounded font-bold uppercase tracking-wider">Live</span>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-[var(--border-primary)]/50">
                                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                                        <Clock size={12} />
                                        <span>Started {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    {(() => {
                                        const status = getJoinStatus(session.id);
                                        if (status === 'approved') {
                                            return (
                                                <button
                                                    onClick={() => navigate(`/session/${session.id}`)}
                                                    className="text-xs font-bold text-green-500 hover:text-green-400 flex items-center gap-1 transition-all duration-300 animate-pulse-once"
                                                >
                                                    <LogIn size={12} className="animate-bounce-in" />
                                                    Join Session
                                                </button>
                                            );
                                        }
                                        if (status === 'pending') {
                                            return (
                                                <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                                                    Request sent
                                                </span>
                                            );
                                        }
                                        if (status === 'rejected') {
                                            return (
                                                <span className="text-xs text-red-400">Request declined</span>
                                            );
                                        }
                                        return (
                                            <button
                                                onClick={() => handleRequestToJoin(session.id)}
                                                disabled={requestToJoin.isPending}
                                                className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
                                            >
                                                <UserPlus size={12} />
                                                Request to Join
                                            </button>
                                        );
                                    })()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Previous Sessions Section (Collapsible) */}
            <div>
                <button
                    onClick={() => setShowPreviousSessions(!showPreviousSessions)}
                    className="flex items-center gap-2 mb-6 group"
                >
                    <ChevronDown
                        size={16}
                        className={`text-[var(--text-secondary)] transition-transform ${showPreviousSessions ? '' : '-rotate-90'}`}
                    />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)] group-hover:text-[var(--text-secondary)] transition-colors">
                        Previous Sessions ({previousSummaries.length})
                    </h2>
                </button>

                {showPreviousSessions && (
                    previousSummaries.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {previousSummaries.map((item) => {
                                const ProductIcon = getProductIcon(item.session.productType);
                                const colorClass = getProductColor(item.session.productType);
                                return (
                                    <div
                                        key={item.session.id}
                                        onClick={() => navigate(`/session/${item.session.id}`)}
                                        className="card hover:border-gray-600 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 bg-[var(--bg-input)] rounded flex items-center justify-center ${colorClass}`}>
                                                    <ProductIcon size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-[var(--text-primary)] group-hover:text-white transition-colors">{item.session?.name}</h3>
                                                    <p className="text-xs text-[var(--text-secondary)]">{item.session.productType || 'Tasting'}</p>
                                                </div>
                                            </div>
                                            {item.summary?.metadata?.rating && (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-lg font-bold text-orange-500">{item.summary.metadata.rating}</span>
                                                    <span className="text-[8px] text-[var(--text-muted)] uppercase font-bold tracking-tighter">Score</span>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-6 leading-relaxed">
                                            {item.summary?.observations || "No summary observations recorded for this session."}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-primary)]">
                                            <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    <span>{item.session?.startedAt ? new Date(item.session.startedAt).toLocaleDateString() : ''}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        archiveSession.mutate(item.session.id);
                                                    }}
                                                    className="text-[10px] text-[var(--text-secondary)] hover:text-orange-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Archive this session"
                                                >
                                                    <Archive size={12} />
                                                    Archive
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/session/${item.session.id}/summary`);
                                                    }}
                                                    className="text-[10px] text-orange-500 font-bold hover:underline flex items-center gap-1"
                                                >
                                                    View Summary <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-[var(--bg-main)]/30 rounded-lg border border-dashed border-[var(--border-primary)]">
                            <p className="text-[var(--text-secondary)] text-sm">No previous sessions found.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
