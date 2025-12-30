import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Wine, Clock, Settings, User, Users as UsersIcon } from 'lucide-react';
import { useAllSummaries, useUserSessions } from '../api/sessions';
import { useChatContext } from '../contexts/ChatContext';
import { Session } from '../types';

export function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { data: summariesData } = useAllSummaries();
    const { data: sessionsData } = useUserSessions();
    const { activeUsers, sessionId } = useChatContext();

    const summaries = summariesData?.summaries || [];
    const allSessions = sessionsData?.sessions || [];

    const activeSessions = allSessions.filter((s: Session) => s.status === 'active');

    return (
        <aside className="sidebar">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                        <Wine size={20} className="text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight cursor-pointer" onClick={() => navigate('/')}>Fellowsip</span>
                </div>

                <div className="mb-6">
                    {sessionId ? (
                        <>
                            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4 px-2 flex items-center gap-2">
                                <UsersIcon size={14} />
                                Active Tasters
                            </h3>
                            <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
                                {activeUsers.map((user) => (
                                    <div key={user.socketId} className="flex items-center gap-3 px-2 py-2 rounded-md bg-[var(--bg-main)]/30 border border-[var(--border-primary)]/50">
                                        <div className="relative">
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.displayName || ''} className="w-8 h-8 rounded-full" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-[var(--bg-input)] flex items-center justify-center">
                                                    <User size={16} className="text-[var(--text-secondary)]" />
                                                </div>
                                            )}
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0b0e14] rounded-full"></span>
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                                                {user.displayName || 'Anonymous'}
                                            </span>
                                            <span className="text-[10px] text-[var(--text-secondary)]">Tasting now</span>
                                        </div>
                                    </div>
                                ))}
                                {activeUsers.length === 0 && (
                                    <p className="text-[10px] text-[var(--text-muted)] italic px-2">No other tasters active...</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6">
                            {activeSessions.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-4 px-2 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                        Active Sessions
                                    </h3>
                                    <div className="space-y-1">
                                        {activeSessions.map((session: Session) => (
                                            <div
                                                key={session.id}
                                                onClick={() => navigate(`/session/${session.id}`)}
                                                className="sidebar-item group border-green-500/10 bg-green-500/5"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium truncate text-[var(--text-primary)]">{session.name}</span>
                                                    <span className="text-[8px] bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded font-bold uppercase">Live</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                                                    <Clock size={10} />
                                                    <span>Started {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4 px-2">Recent Tastings</h3>
                                <div className="space-y-1 max-h-[calc(100vh-450px)] overflow-y-auto pr-2">
                                    {summaries.slice(0, 8).map((item) => (
                                        <div
                                            key={item.session.id}
                                            onClick={() => navigate(`/session/${item.session.id}/summary`)}
                                            className={`sidebar-item ${location.pathname.includes(item.session.id) ? 'active' : ''}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium truncate text-[var(--text-primary)]">{item.session?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                                                <Clock size={10} />
                                                <span>{item.session?.startedAt ? new Date(item.session.startedAt).toLocaleDateString() : ''}</span>
                                                {item.summary?.metadata?.rating && (
                                                    <span className="text-green-500">● Synthesized</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {summaries.length === 0 && (
                                        <p className="text-[10px] text-[var(--text-muted)] italic px-2">No recent tastings...</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-auto p-4 border-t border-[var(--border-primary)]">
                <button
                    onClick={() => navigate('/create')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-transparent border border-[var(--border-primary)] rounded-md text-sm font-medium hover:bg-[var(--bg-input)] transition-colors mb-4"
                >
                    <Plus size={16} />
                    New Session
                </button>

                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--bg-input)] flex items-center justify-center">
                            <User size={16} className="text-[var(--text-secondary)]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-[var(--text-primary)]">Current User</span>
                            <span className="text-[10px] text-[var(--text-secondary)]">Sommelier Lvl 2</span>
                        </div>
                    </div>
                    <Settings size={16} className="text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-secondary)]" />
                </div>
            </div>
        </aside>
    );
}
