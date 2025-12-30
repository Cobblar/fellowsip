import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, FileText, CheckCircle2, Share2, Users, MessageSquare, Lock, Globe } from 'lucide-react';
import { useChatContext } from '../contexts/ChatContext';
import { useUpdateSharing } from '../api/sessions';

interface PostSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PostSessionModal({ isOpen, onClose }: PostSessionModalProps) {
    const navigate = useNavigate();
    const { sessionEndedBy, isAnalyzing, summaryId, updateRating, sessionId, currentUserId, activeUsers } = useChatContext();
    const initialRating = activeUsers.find(u => u.userId === currentUserId)?.rating;
    const [userRating, setUserRating] = useState<number | null>(initialRating ?? null);
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);

    const updateSharing = useUpdateSharing();
    const [sharing, setSharing] = useState({
        sharePersonalSummary: false,
        shareGroupSummary: false,
        shareSessionLog: false
    });

    if (!isOpen) return null;

    const handleRate = async (rating: number) => {
        setUserRating(rating);
        setIsSubmittingRating(true);
        try {
            await updateRating(rating);
        } catch (error) {
            console.error('Failed to update rating:', error);
        } finally {
            setIsSubmittingRating(false);
        }
    };

    const handleToggleSharing = (key: keyof typeof sharing) => {
        const newValue = !sharing[key];
        setSharing(prev => ({ ...prev, [key]: newValue }));
        if (sessionId) {
            updateSharing.mutate({
                sessionId,
                data: { [key]: newValue }
            });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 text-center border-b border-[var(--border-primary)] bg-gradient-to-b from-orange-500/5 to-transparent">
                    <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
                        <CheckCircle2 className="text-orange-500" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Session Ended</h2>
                    <p className="text-sm text-[var(--text-secondary)]">
                        {sessionEndedBy || 'The host'} has concluded this tasting session.
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Summary Status */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-center">Tasting Summary</h3>
                        {isAnalyzing ? (
                            <div className="flex flex-col items-center gap-3 py-6 bg-[var(--bg-input)] rounded-xl border border-[var(--border-primary)] border-dashed animate-pulse">
                                <Loader2 className="text-orange-500 animate-spin" size={28} />
                                <div className="text-center">
                                    <span className="text-sm font-bold text-[var(--text-primary)] block">Creating summary...</span>
                                </div>
                            </div>
                        ) : summaryId ? (
                            <button
                                onClick={() => navigate(`/session/${sessionId}/summary`)}
                                className="w-full flex flex-col items-center gap-1 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-600/20 group animate-in zoom-in-95 duration-300"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText size={20} className="group-hover:scale-110 transition-transform" />
                                    View Session Summary
                                </div>
                                <span className="text-[9px] uppercase tracking-widest opacity-70">Summary Ready</span>
                            </button>
                        ) : (
                            <div className="text-center py-4 text-sm text-[var(--text-muted)] italic">
                                No summary was requested for this session.
                            </div>
                        )}
                    </div>

                    {/* Rating Prompt */}
                    <div className="space-y-4 pt-4 border-t border-[var(--border-primary)]">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Assign Score</h3>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={userRating ?? ''}
                                onChange={(e) => {
                                    const val = e.target.value === '' ? null : parseInt(e.target.value);
                                    if (val === null || (val >= 0 && val <= 100)) {
                                        handleRate(val ?? 0);
                                    }
                                }}
                                className="w-16 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg py-1 px-2 text-xl font-black text-orange-500 text-center focus:outline-none focus:border-orange-500 transition-colors no-spinner"
                            />
                        </div>
                        <div className="space-y-4 hidden md:block">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={userRating ?? 0}
                                onChange={(e) => handleRate(parseInt(e.target.value))}
                                disabled={isSubmittingRating}
                                className="w-full h-2 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                            <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter">
                                <span>0</span>
                                <span>50</span>
                                <span>100</span>
                            </div>
                        </div>
                    </div>

                    {/* Sharing Settings */}
                    <div className="space-y-4 pt-4 border-t border-[var(--border-primary)]">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Sharing Settings</h3>
                        <div className="space-y-2">
                            {[
                                {
                                    key: 'sharePersonalSummary',
                                    label: 'Personal Notes',
                                    desc: 'Let others see your individual tasting notes.',
                                    icon: Share2
                                },
                                {
                                    key: 'shareGroupSummary',
                                    label: 'Shared Summary',
                                    desc: 'Contribute to the collective shared summary.',
                                    icon: Users
                                },
                                {
                                    key: 'shareSessionLog',
                                    label: 'Public Chat Log',
                                    desc: 'Make the chat history public for this session.',
                                    icon: MessageSquare
                                }
                            ].map((item) => (
                                <button
                                    key={item.key}
                                    onClick={() => handleToggleSharing(item.key as any)}
                                    className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${sharing[item.key as keyof typeof sharing]
                                        ? 'bg-orange-500/5 border-orange-500/30 ring-1 ring-orange-500/20'
                                        : 'bg-[var(--bg-input)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
                                        }`}
                                >
                                    <div className={`mt-0.5 p-2 rounded-lg ${sharing[item.key as keyof typeof sharing] ? 'bg-orange-500 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'}`}>
                                        <item.icon size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-[var(--text-primary)]">{item.label}</span>
                                            {sharing[item.key as keyof typeof sharing] ? (
                                                <Globe size={12} className="text-orange-500" />
                                            ) : (
                                                <Lock size={12} className="text-[var(--text-muted)]" />
                                            )}
                                        </div>
                                        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">{item.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-[var(--bg-input)] flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="flex-1 py-3 text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--bg-card)] rounded-lg transition-colors border border-[var(--border-primary)]"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        </div>
    );
}
