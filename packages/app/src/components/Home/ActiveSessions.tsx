import React from 'react';
import { Clock, ChevronRight, Users, LogIn, UserPlus, PlayCircle } from 'lucide-react';
import { getProductIcon } from '../../utils/productIcons';

interface ActiveSessionsProps {
    activeSessions: any[];
    friendsSessions: any[];
    getJoinStatus: (sessionId: string) => 'none' | 'pending' | 'approved' | 'rejected';
    onJoinSession: (sessionId: string) => void;
    onRequestToJoin: (sessionId: string) => void;
    requestToJoinPending: boolean;
}

export const ActiveSessions: React.FC<ActiveSessionsProps> = ({
    activeSessions,
    friendsSessions,
    getJoinStatus,
    onJoinSession,
    onRequestToJoin,
    requestToJoinPending,
}) => {
    return (
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
                                const productEmoji = getProductIcon(session.productType);
                                return (
                                    <div
                                        key={session.id}
                                        onClick={() => onJoinSession(session.id)}
                                        className="card border-green-500/20 hover:border-green-500/50 transition-all cursor-pointer group bg-green-500/5 p-5"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[var(--bg-input)] rounded flex items-center justify-center text-xl">
                                                    {productEmoji}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--text-primary)]">{session.name}</h3>
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
                                const productEmoji = getProductIcon(session.productType);
                                return (
                                    <div
                                        key={session.id}
                                        className="card border-blue-500/20 hover:border-blue-500/50 transition-all bg-blue-500/5 p-5"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[var(--bg-input)] rounded flex items-center justify-center text-xl">
                                                    {productEmoji}
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
                                                    onClick={() => onJoinSession(session.id)}
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
                                                    onClick={() => onRequestToJoin(session.id)}
                                                    disabled={requestToJoinPending}
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
    );
};
