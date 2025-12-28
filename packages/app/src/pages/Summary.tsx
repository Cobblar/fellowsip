import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Calendar, Users, Clock,
    Wine, Star, Edit2, Save, X, Zap, Link2, User, ChevronLeft
} from 'lucide-react';
import { api } from '../api/client';
import { useCurrentUser } from '../api/auth';
import { useUpdateSummary } from '../api/sessions';
import type { Session } from '../types';

interface TasterSummary {
    userId: string;
    userName: string;
    nose: string;
    palate: string;
    finish: string;
    observations: string;
}

interface TastingSummary {
    nose: string;
    palate: string;
    finish: string;
    observations: string;
    tasterSummaries?: TasterSummary[];
    metadata: {
        rating?: number;
        tags?: string[];
        participants?: string[];
    };
    participants?: Array<{
        userId: string;
        rating: number | null;
        displayName: string | null;
        avatarUrl: string | null;
    }>;
    createdAt: string;
}


export function Summary() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: userData } = useCurrentUser();
    const updateSummaryMutation = useUpdateSummary();

    const [summary, setSummary] = useState<TastingSummary | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<TastingSummary> & { rating?: number }>({});

    // Check if we should be showing the "analyzing" state
    const queryParams = new URLSearchParams(window.location.search);
    const [isAnalyzing, setIsAnalyzing] = useState(queryParams.get('analyzing') === 'true');

    useEffect(() => {
        if (summary && userData?.user?.id && !selectedMemberId) {
            const hasUserSummary = summary.tasterSummaries?.some(
                s => s.userId === userData.user.id
            );
            if (hasUserSummary) {
                setSelectedMemberId(userData.user.id);
            }
        }
    }, [summary, userData, selectedMemberId]);

    useEffect(() => {
        let pollInterval: NodeJS.Timeout;

        const fetchData = async () => {
            try {
                const sessionRes = await api.get<{ session: Session }>(`/sessions/${id}`);
                setSession(sessionRes.session);

                try {
                    const summaryRes = await api.get<{ summary: TastingSummary }>(`/sessions/${id}/summary`);
                    if (summaryRes.summary) {
                        setSummary(summaryRes.summary);
                        setIsLoading(false);
                        setIsAnalyzing(false);
                        if (pollInterval) clearInterval(pollInterval);
                    }
                } catch (summaryErr: any) {
                    // If 404, it might still be processing
                    if (summaryErr.status === 404) {
                        console.log('Summary not found yet');
                        if (isAnalyzing) {
                            setIsLoading(true);
                        } else {
                            setIsLoading(false);
                        }
                    } else {
                        throw summaryErr;
                    }
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
                setIsLoading(false);
            }
        };

        fetchData();

        if (isAnalyzing) {
            pollInterval = setInterval(fetchData, 3000);
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [id, isAnalyzing]);

    const handleAnalyzeNow = async () => {
        try {
            setIsAnalyzing(true);
            setIsLoading(true);
            await api.post(`/sessions/${id}/end`, { shouldAnalyze: true });
        } catch (err) {
            console.error('Failed to start synthesis:', err);
            setIsAnalyzing(false);
            setIsLoading(false);
        }
    };

    const handleEdit = () => {
        if (!summary) return;

        const userSummary = summary.tasterSummaries?.find(s => s.userId === userData?.user?.id);
        const userRating = summary.participants?.find(p => p.userId === userData?.user?.id)?.rating;

        setEditData({
            nose: userSummary?.nose || summary.nose,
            palate: userSummary?.palate || summary.palate,
            finish: userSummary?.finish || summary.finish,
            observations: userSummary?.observations || summary.observations,
            rating: userRating ?? undefined
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!id) return;
        try {
            await updateSummaryMutation.mutateAsync({
                id,
                data: {
                    nose: editData.nose,
                    palate: editData.palate,
                    finish: editData.finish,
                    observations: editData.observations,
                    rating: editData.rating
                }
            });

            // Update local state
            setSummary(prev => {
                if (!prev) return null;

                // Update participants array with new rating
                const newParticipants = prev.participants?.map(p =>
                    p.userId === userData?.user?.id
                        ? { ...p, rating: editData.rating ?? p.rating }
                        : p
                );

                return {
                    ...prev,
                    participants: newParticipants,
                    // Note: We don't update group observations here as they are separate
                    // but the backend updateSummaryMutation handles the logic
                };
            });

            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update summary:', err);
        }
    };

    if (isLoading && isAnalyzing && !summary) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-4 md:p-8 text-center bg-[var(--bg-main)]">
                <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6 relative">
                    <Zap size={40} className="text-orange-500 animate-pulse" />
                    <div className="absolute inset-0 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Synthesizing tasting notes...</h2>
                <p className="text-[var(--text-secondary)] mb-8 max-w-md leading-relaxed">
                    We're synthesizing the group's notes into a professional tasting profile. This usually takes about 10-15 seconds.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => navigate(`/session/${id}`)} className="btn-outline">
                        Return to Chat
                    </button>
                    <div className="px-6 py-3 bg-[var(--bg-input)]/50 rounded-lg text-xs text-[var(--text-secondary)] border border-[var(--border-primary)]">
                        Processing data...
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading && !summary) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-4 md:p-8 text-center bg-[var(--bg-main)]">
                <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-6"></div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Loading Summary...</h2>
                <p className="text-[var(--text-secondary)]">Please wait while we fetch the tasting analysis.</p>
            </div>
        );
    }

    if (!session || !summary) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-4 md:p-8 text-center bg-[var(--bg-main)]">
                <div className="w-20 h-20 bg-[var(--bg-input)]/50 rounded-full flex items-center justify-center mb-6">
                    <Wine size={40} className="text-[var(--text-muted)]" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">No Synthesis Yet</h2>
                <p className="text-[var(--text-secondary)] mb-8 max-w-md leading-relaxed">
                    This session was ended without synthesis. You can trigger the session synthesis now to generate a professional tasting profile.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/')} className="btn-outline">
                        Return Home
                    </button>
                    <button onClick={handleAnalyzeNow} className="btn-orange flex items-center gap-2">
                        <Zap size={18} />
                        Synthesize Now
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8">
                <div className="flex items-start gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-white md:hidden flex-shrink-0"
                        title="Go Back"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="heading-xl">{session.productName || session.name}</h1>
                            {session.productLink && (
                                <a
                                    href={session.productLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 bg-[var(--bg-input)] rounded-full text-[var(--text-secondary)] hover:text-orange-500 transition-colors"
                                    title="View Product Page"
                                >
                                    <Link2 size={16} />
                                </a>
                            )}
                        </div>
                        {session.productName && <p className="text-sm text-[var(--text-secondary)] mb-2">{session.name}</p>}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--text-secondary)]">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                <span>{new Date(session.startedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={14} />
                                <span>
                                    {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {' - '}
                                    {session.endedAt
                                        ? new Date(session.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : 'ongoing'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                <span>
                                    {(() => {
                                        const start = new Date(session.startedAt).getTime();
                                        const end = session.endedAt
                                            ? new Date(session.endedAt).getTime()
                                            : Date.now();
                                        const durationMs = end - start;
                                        const hours = Math.floor(durationMs / (1000 * 60 * 60));
                                        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                                        if (hours > 0) {
                                            return `(${hours}h ${minutes}m)`;
                                        }
                                        return `(${minutes}m)`;
                                    })()}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users size={14} />
                                <span>{summary.metadata.participants?.length || 0} Tasters</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex rounded-md overflow-hidden border border-[var(--border-primary)]">
                        <button className="px-4 py-2 bg-[var(--bg-input)] text-sm font-medium">Analysis</button>
                        <button
                            onClick={() => navigate(`/session/${session.id}`)}
                            className="px-4 py-2 hover:bg-[var(--bg-input)] text-sm font-medium text-[var(--text-secondary)] transition-colors"
                        >
                            Transcript
                        </button>
                    </div>
                    {isEditing ? (
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditing(false)} className="btn-outline flex items-center gap-2">
                                <X size={16} /> Cancel
                            </button>
                            <button onClick={handleSave} className="btn-orange">
                                <Save size={16} /> Save Changes
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleEdit} className="btn-orange">
                            <Edit2 size={16} /> Edit Analysis
                        </button>
                    )}
                </div>
            </div>

            {/* Main Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {/* Left Column: Personal Summary & Tasters */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                            <User size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">Your Tasting Note</h2>
                            <p className="text-xs text-[var(--text-secondary)]">Your personal synthesized experience</p>
                        </div>
                    </div>

                    <div className="card p-8 bg-orange-500/[0.02] border-orange-500/10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <Star size={20} className="text-orange-500" />
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">Your Score</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-4xl md:text-5xl font-black text-orange-500">
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="1"
                                            value={editData.rating ?? ''}
                                            onChange={(e) => setEditData({ ...editData, rating: parseFloat(e.target.value) })}
                                            className="w-24 bg-transparent border-b-2 border-orange-500 text-center focus:outline-none"
                                        />
                                    ) : (
                                        summary.participants?.find(p => p.userId === userData?.user?.id)?.rating ?? '--'
                                    )}
                                </div>
                                {isEditing && (
                                    <button
                                        onClick={handleSave}
                                        className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                                        title="Save Score"
                                    >
                                        <Save size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            {!summary.tasterSummaries?.find(s => s.userId === userData?.user?.id) && !isEditing ? (
                                <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg text-center">
                                    <p className="text-sm text-[var(--text-secondary)] mb-2">
                                        We couldn't generate a personalized profile for you based on your chat messages.
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        Try contributing more specific tasting notes (aroma, flavor, finish) in the chat next time!
                                    </p>
                                    <button
                                        onClick={handleEdit}
                                        className="mt-3 text-xs font-bold text-orange-500 hover:text-orange-400 uppercase tracking-wider"
                                    >
                                        Add Notes Manually
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500/60">Observations</h4>
                                        {isEditing ? (
                                            <textarea
                                                value={editData.observations}
                                                onChange={(e) => setEditData({ ...editData, observations: e.target.value })}
                                                className="w-full bg-[var(--bg-main)] border-[var(--border-primary)] text-sm text-[var(--text-secondary)] min-h-[100px] rounded-lg p-3"
                                            />
                                        ) : (
                                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                                {summary.tasterSummaries?.find(s => s.userId === userData?.user?.id)?.observations || summary.observations}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {[
                                            { label: 'Nose', key: 'nose' as const, icon: '👃' },
                                            { label: 'Palate', key: 'palate' as const, icon: '👅' },
                                            { label: 'Finish', key: 'finish' as const, icon: '✨' }
                                        ].map(({ label, key, icon }) => (
                                            <div key={key} className="space-y-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs">{icon}</span>
                                                    <h5 className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</h5>
                                                </div>
                                                {isEditing ? (
                                                    <textarea
                                                        value={editData[key]}
                                                        onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                                                        className="w-full bg-[var(--bg-main)] border-[var(--border-primary)] text-xs text-[var(--text-secondary)] min-h-[60px] rounded-md p-2"
                                                    />
                                                ) : (
                                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                                        {summary.tasterSummaries?.find(s => s.userId === userData?.user?.id)?.[key] || (summary as any)[key]}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
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
                            {summary.participants
                                ?.filter(p => p.userId !== userData?.user?.id) // Filter out current user
                                .reduce((acc: any[], current) => { // Deduplicate by userId
                                    if (!acc.find(p => p.userId === current.userId)) {
                                        acc.push(current);
                                    }
                                    return acc;
                                }, [])
                                .map(participant => {
                                    const isSelected = selectedMemberId === participant.userId;
                                    const tasterNote = summary.tasterSummaries?.find(s => s.userId === participant.userId);

                                    return (
                                        <div key={participant.userId} className="space-y-2">
                                            <button
                                                onClick={() => setSelectedMemberId(isSelected ? null : participant.userId)}
                                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${isSelected ? 'bg-orange-500/5 border-orange-500/30' : 'bg-[var(--bg-card)] border-[var(--border-primary)] hover:border-[var(--text-muted)]'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {participant.avatarUrl ? (
                                                        <img src={participant.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-[var(--bg-input)] flex items-center justify-center">
                                                            <User size={16} className="text-[var(--text-secondary)]" />
                                                        </div>
                                                    )}
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-[var(--text-primary)]">{participant.displayName || 'Anonymous'}</p>
                                                        <p className="text-[10px] text-[var(--text-secondary)]">{participant.userId === userData?.user?.id ? 'You' : 'Participant'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {participant.rating !== null && (
                                                        <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 rounded text-xs font-bold text-orange-500">
                                                            <Star size={12} fill="currentColor" />
                                                            {participant.rating}
                                                        </div>
                                                    )}
                                                    <div className={`p-1.5 rounded-full transition-transform ${isSelected ? 'rotate-180 bg-orange-500/20 text-orange-500' : 'text-[var(--text-muted)]'}`}>
                                                        <Zap size={14} />
                                                    </div>
                                                </div>
                                            </button>

                                            {isSelected && tasterNote && (
                                                <div className="p-6 bg-orange-500/[0.02] border border-orange-500/10 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">\"{tasterNote.observations}\"</p>
                                                    <div className="grid grid-cols-3 gap-4 pt-2 border-t border-orange-500/10">
                                                        <div>
                                                            <p className="text-[9px] font-bold uppercase text-orange-500/60 mb-1">Nose</p>
                                                            <p className="text-[10px] text-[var(--text-secondary)]">{tasterNote.nose}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-bold uppercase text-orange-500/60 mb-1">Palate</p>
                                                            <p className="text-[10px] text-[var(--text-secondary)]">{tasterNote.palate}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-bold uppercase text-orange-500/60 mb-1">Finish</p>
                                                            <p className="text-[10px] text-[var(--text-secondary)]">{tasterNote.finish}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>

                {/* Right Column: Group Summary & Descriptors */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                            <Users size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">Group Perspective</h2>
                            <p className="text-xs text-[var(--text-secondary)]">Combined insights from all participants</p>
                        </div>
                    </div>

                    <div className="card p-8 border-blue-500/10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <Star size={20} className="text-blue-500" />
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">Group Average</h3>
                            </div>
                            <div className="text-4xl md:text-5xl font-black text-blue-500">
                                {(() => {
                                    const ratings = summary.participants?.map(p => p.rating).filter((r): r is number => r !== null) || [];
                                    if (ratings.length === 0) return '--';
                                    return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
                                })()}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500/60">Synthesis</h4>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                    {summary.observations}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { label: 'Nose', value: summary.nose, icon: '👃' },
                                    { label: 'Palate', value: summary.palate, icon: '👅' },
                                    { label: 'Finish', value: summary.finish, icon: '✨' }
                                ].map(item => (
                                    <div key={item.label} className="space-y-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs">{item.icon}</span>
                                            <h5 className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{item.label}</h5>
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h2 className="heading-lg mb-4">Common Descriptors</h2>
                        <div className="flex flex-wrap gap-2">
                            {summary.metadata.tags?.map(tag => (
                                <span key={tag} className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded text-xs text-[var(--text-secondary)]">
                                    #{tag}
                                </span>
                            )) || <span className="text-xs text-[var(--text-muted)] italic">No descriptors detected</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
