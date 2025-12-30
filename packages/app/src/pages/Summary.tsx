import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Wine, Calendar, Star, MessageSquare, Edit2, Save, X, Share2, Globe, Lock, Zap, Users, User, ChevronRight } from 'lucide-react';
import { useSessionSummary, useUpdateSummary, useUpdateSharing, usePublicSummary } from '../api/sessions';
import { useCurrentUser } from '../api/auth';
import type { Participant } from '../types';

interface TasterSummary {
    userId: string;
    nose: string;
    palate: string;
    finish: string;
    observations: string;
}

interface TastingSummary {
    id: string;
    sessionId: string;
    nose: string;
    palate: string;
    finish: string;
    observations: string;
    metadata: {
        participants?: string[];
        [key: string]: any;
    };
    tasterSummaries?: TasterSummary[];
    participants?: Array<{
        userId: string;
        rating: number | null;
        displayName: string | null;
        avatarUrl: string | null;
        sharePersonalSummary?: boolean;
        shareGroupSummary?: boolean;
    }>;
    createdAt: string;
}

interface SummaryProps {
    publicMode?: boolean;
}

export function Summary({ publicMode = false }: SummaryProps) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: currentUserData } = useCurrentUser();
    const currentUser = currentUserData?.user;

    const { data: sessionSummaryData, isLoading: sessionSummaryLoading } = useSessionSummary(id || '');
    const { data: publicSessionData, isLoading: publicSessionLoading } = usePublicSummary(id || '');

    const summaryData = publicMode ? publicSessionData?.summary : sessionSummaryData?.summary;
    const isLoading = publicMode ? publicSessionLoading : sessionSummaryLoading;

    const updateSummary = useUpdateSummary();
    const updateSharing = useUpdateSharing();

    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [editData, setEditData] = useState<Partial<TasterSummary> & { rating?: number }>({});

    const session = summaryData;
    const summary = summaryData as TastingSummary | undefined;
    const participants = (summaryData?.participants || []) as Participant[];

    const userParticipant = participants.find(p => p.userId === currentUser?.id);

    useEffect(() => {
        if (summary && currentUser?.id && !selectedMemberId) {
            const hasUserSummary = summary.tasterSummaries?.some(
                (s: TasterSummary) => s.userId === currentUser.id
            );
            if (hasUserSummary) {
                setSelectedMemberId(currentUser.id);
            }
        }
    }, [summary, currentUser, selectedMemberId]);

    const handleEdit = () => {
        if (!summary || publicMode) return;

        const userSummary = summary.tasterSummaries?.find((s: TasterSummary) => s.userId === currentUser?.id);
        const userRating = participants.find(p => p.userId === currentUser?.id)?.rating;

        setEditData({
            nose: userSummary?.nose || '',
            palate: userSummary?.palate || '',
            finish: userSummary?.finish || '',
            observations: userSummary?.observations || '',
            rating: userRating ?? undefined
        });
        setIsEditingNotes(true);
    };

    const handleSave = async () => {
        if (!id || publicMode) return;
        try {
            await updateSummary.mutateAsync({
                id,
                data: {
                    nose: editData.nose,
                    palate: editData.palate,
                    finish: editData.finish,
                    observations: editData.observations,
                    rating: editData.rating
                }
            });

            queryClient.invalidateQueries({ queryKey: ['session', id] });
            queryClient.invalidateQueries({ queryKey: ['publicSummary', id] });

            setIsEditingNotes(false);
        } catch (err) {
            console.error('Failed to update summary:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-main)]">
                <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-6"></div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Loading Summary...</h2>
            </div>
        );
    }

    if (!session || !summary) {
        return (
            <div className="p-8 text-center">
                <h2 className="heading-lg mb-2">Summary Not Found</h2>
                <p className="text-[var(--text-secondary)] mb-6">This session may not have a summary yet or it is private.</p>
                <button onClick={() => navigate('/')} className="btn-orange">Return Home</button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-orange-500 mb-2">
                        <Wine size={20} />
                        <span className="text-xs font-bold uppercase tracking-widest">Tasting Summary</span>
                        {publicMode && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                                <Globe size={10} />
                                Public View
                            </span>
                        )}
                    </div>
                    <h1 className="heading-xl mb-2">{session.name}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                        {session.productType && (
                            <span className="px-2 py-0.5 bg-[var(--bg-input)] rounded text-[10px] font-bold uppercase tracking-wider border border-[var(--border-primary)]">
                                {session.productType}
                            </span>
                        )}
                    </div>
                </div>

                {!publicMode && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                const url = `${window.location.origin}/session/${id}/summary/public`;
                                navigator.clipboard.writeText(url);
                                alert('Public link copied to clipboard!');
                            }}
                            className="btn-secondary text-xs py-2"
                        >
                            <Share2 size={14} />
                            Copy Public Link
                        </button>
                    </div>
                )}
            </div>

            {/* Sharing Controls */}
            {!publicMode && userParticipant && (
                <div className="card p-4 mb-8 border-orange-500/20 bg-orange-500/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                                <Share2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">Sharing Preferences</h3>
                                <p className="text-xs text-[var(--text-secondary)]">Control what appears on your public profile.</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div
                                    onClick={() => updateSharing.mutate({
                                        sessionId: id!,
                                        data: { sharePersonalSummary: !userParticipant.sharePersonalSummary }
                                    })}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${userParticipant.sharePersonalSummary ? 'bg-orange-500' : 'bg-[var(--bg-input)]'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${userParticipant.sharePersonalSummary ? 'left-6' : 'left-1'}`}></div>
                                </div>
                                <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-white transition-colors">Share Personal Notes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div
                                    onClick={() => updateSharing.mutate({
                                        sessionId: id!,
                                        data: { shareGroupSummary: !userParticipant.shareGroupSummary }
                                    })}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${userParticipant.shareGroupSummary ? 'bg-orange-500' : 'bg-[var(--bg-input)]'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${userParticipant.shareGroupSummary ? 'left-6' : 'left-1'}`}></div>
                                </div>
                                <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-white transition-colors">Share Group Summary</span>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {/* Left: Personal/Selected Note */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">Tasting Note</h2>
                            <p className="text-xs text-[var(--text-secondary)]">
                                {selectedMemberId === currentUser?.id ? 'Your personal perspective' : 'Participant perspective'}
                            </p>
                        </div>
                    </div>

                    <div className="card p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">Rating</span>
                                <div className="text-3xl font-black text-white flex items-baseline gap-1">
                                    {isEditingNotes ? (
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={editData.rating || ''}
                                            onChange={(e) => setEditData({ ...editData, rating: parseInt(e.target.value) })}
                                            className="w-20 bg-transparent border-b-2 border-orange-500 text-center focus:outline-none"
                                        />
                                    ) : (
                                        participants.find(p => p.userId === (selectedMemberId || currentUser?.id))?.rating ?? '--'
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-orange-500">Notes</h3>
                                {!publicMode && selectedMemberId === currentUser?.id && (
                                    <button
                                        onClick={handleEdit}
                                        className="p-1 hover:bg-[var(--bg-input)] rounded transition-colors text-[var(--text-muted)] hover:text-white"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                )}
                            </div>

                            {!summary.tasterSummaries?.find((s: TasterSummary) => s.userId === (selectedMemberId || currentUser?.id)) && !isEditingNotes ? (
                                <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg text-center">
                                    <p className="text-sm text-[var(--text-secondary)] mb-2">No personalized profile found.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500/60">Observations</h4>
                                        {isEditingNotes ? (
                                            <textarea
                                                value={editData.observations}
                                                onChange={(e) => setEditData({ ...editData, observations: e.target.value })}
                                                className="w-full bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg p-3 text-sm focus:outline-none focus:border-orange-500 min-h-[100px]"
                                            />
                                        ) : (
                                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                                {summary.tasterSummaries?.find((s: TasterSummary) => s.userId === (selectedMemberId || currentUser?.id))?.observations || 'No observations recorded.'}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            { key: 'nose' as const, label: 'Nose', icon: '👃' },
                                            { key: 'palate' as const, label: 'Palate', icon: '👅' },
                                            { key: 'finish' as const, label: 'Finish', icon: '✨' }
                                        ].map(({ key, label, icon }) => (
                                            <div key={key} className="p-4 bg-[var(--bg-input)]/50 rounded-xl border border-[var(--border-primary)]">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs">{icon}</span>
                                                    <h5 className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</h5>
                                                </div>
                                                {isEditingNotes ? (
                                                    <textarea
                                                        value={editData[key]}
                                                        onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                                                        className="w-full bg-transparent border-b border-orange-500/30 focus:border-orange-500 text-xs py-1 outline-none resize-none"
                                                        rows={2}
                                                    />
                                                ) : (
                                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                                        {summary.tasterSummaries?.find((s: TasterSummary) => s.userId === (selectedMemberId || currentUser?.id))?.[key] || `No ${label.toLowerCase()} notes recorded.`}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {isEditingNotes && (
                                        <div className="flex gap-2 justify-end mt-4">
                                            <button onClick={() => setIsEditingNotes(false)} className="btn-outline flex items-center gap-2">
                                                <X size={16} /> Cancel
                                            </button>
                                            <button onClick={handleSave} className="btn-orange flex items-center gap-2">
                                                <Save size={16} /> Save Notes
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                            <Users size={14} />
                            Individual Tasters
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {participants
                                .filter((p: Participant) => {
                                    // In public mode, only show those who shared their personal summary
                                    if (publicMode) return p.sharePersonalSummary;
                                    // In private mode, show everyone
                                    return true;
                                })
                                .reduce((acc: Participant[], current: Participant) => {
                                    if (!acc.find(p => p.userId === current.userId)) {
                                        acc.push(current);
                                    }
                                    return acc;
                                }, [])
                                .sort((a: Participant, b: Participant) => (b.rating || 0) - (a.rating || 0))
                                .map(taster => {
                                    const isSelected = selectedMemberId === taster.userId;
                                    const isMe = taster.userId === currentUser?.id;
                                    return (
                                        <div key={taster.userId} className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setSelectedMemberId(isSelected ? null : taster.userId)}
                                                    className={`flex-1 flex items-center justify-between p-4 rounded-xl border transition-all ${isSelected ? 'bg-orange-500/5 border-orange-500/30' : 'bg-[var(--bg-card)] border-[var(--border-primary)] hover:border-[var(--text-muted)]'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/profile/${taster.userId}/public`);
                                                            }}
                                                            className="w-8 h-8 rounded-full bg-[var(--bg-input)] flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-orange-500 transition-all"
                                                        >
                                                            {taster.avatarUrl ? (
                                                                <img src={taster.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User size={16} className="text-[var(--text-secondary)]" />
                                                            )}
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="flex items-center gap-2">
                                                                <p
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigate(`/profile/${taster.userId}/public`);
                                                                    }}
                                                                    className="text-sm font-bold text-white cursor-pointer hover:text-orange-500 transition-colors"
                                                                >
                                                                    {taster.displayName || 'Anonymous'}
                                                                </p>
                                                                {taster.sharePersonalSummary && <Globe size={10} className="text-blue-400" />}
                                                                {!taster.sharePersonalSummary && !publicMode && <Lock size={10} className="text-[var(--text-muted)]" />}
                                                            </div>
                                                            <p className="text-[10px] text-[var(--text-secondary)]">{isMe ? 'You' : 'Participant'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {taster.rating !== null && (
                                                            <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 rounded text-xs font-bold text-orange-500">
                                                                <Star size={12} fill="currentColor" />
                                                                {taster.rating}
                                                            </div>
                                                        )}
                                                        <ChevronRight size={14} className={`text-[var(--text-muted)] transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>

                {/* Right: Group Synthesis */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                            <Zap size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">Group Synthesis</h2>
                            <p className="text-xs text-[var(--text-secondary)]">AI-synthesized collective perspective</p>
                        </div>
                    </div>

                    <div className="card p-6 md:p-8 space-y-8">
                        {publicMode && !summary.observations && !summary.nose && !summary.palate && !summary.finish ? (
                            <div className="text-center py-8">
                                <Lock size={24} className="mx-auto text-[var(--text-muted)] mb-3" />
                                <p className="text-sm text-[var(--text-muted)]">Group synthesis is private for this session.</p>
                                <p className="text-xs text-[var(--text-muted)] mt-1">Only individual tasting notes have been shared.</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-orange-500">Group Perspective</h3>
                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">
                                        "{summary.observations}"
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    {[
                                        { key: 'nose' as const, label: 'Collective Nose', icon: '👃' },
                                        { key: 'palate' as const, label: 'Collective Palate', icon: '👅' },
                                        { key: 'finish' as const, label: 'Collective Finish', icon: '✨' }
                                    ].map(({ key, label, icon }) => (
                                        <div key={key} className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">{icon}</span>
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</h4>
                                            </div>
                                            <p className="text-sm text-[var(--text-primary)] leading-relaxed pl-6 border-l border-[var(--border-primary)]">
                                                {summary[key]}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="card p-4 flex flex-col items-center justify-center text-center">
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Avg Rating</p>
                            <p className="text-2xl font-black text-white">
                                {Math.round(participants.reduce((acc, p) => acc + (p.rating || 0), 0) / (participants.filter(p => p.rating !== null).length || 1))}
                            </p>
                        </div>
                        <div className="card p-4 flex flex-col items-center justify-center text-center">
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Tasters</p>
                            <p className="text-2xl font-black text-white">{participants.length}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
