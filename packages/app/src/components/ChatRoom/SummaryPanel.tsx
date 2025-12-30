import React from 'react';
import { BarChart3, Tag, Star, X } from 'lucide-react';

interface SummaryPanelProps {
    wordFrequencies: { word: string; count: number }[];
    currentUserId: string | null;
    activeUsers: any[];
    updateRating: (rating: number) => void;
    onCloseSidebar: () => void;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
    wordFrequencies,
    currentUserId,
    activeUsers,
    updateRating,
    onCloseSidebar,
}) => {
    const userRating = activeUsers.find(u => u.userId === currentUserId)?.rating ?? '';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-orange-500" />
                    <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">Tasting Summary</h2>
                </div>
                <button onClick={onCloseSidebar} className="text-[var(--text-secondary)] hover:text-white md:hidden">
                    <X size={16} />
                </button>
            </div>

            <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Tag size={16} className="text-green-500" />
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Common Descriptors</h3>
                </div>
                <div className="space-y-4">
                    {wordFrequencies.length > 0 ? (
                        wordFrequencies.slice(0, 5).map(({ word, count }) => (
                            <div key={word} className="animate-fade-in-up">
                                <div className="flex justify-between text-[10px] mb-1.5">
                                    <span className="text-[var(--text-secondary)] capitalize">{word}</span>
                                    <span
                                        key={`${word}-${count}`}
                                        className="text-green-500 font-bold animate-pulse-highlight"
                                    >
                                        {count} mention{count !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="progress-container h-1.5">
                                    <div
                                        className="progress-bar bg-green-500"
                                        style={{ width: `${Math.min(100, (count / Math.max(...wordFrequencies.map(f => f.count))) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-[var(--text-muted)] italic">Start chatting to see common descriptors emerge...</p>
                    )}
                </div>
            </div>

            <div className="card p-5 bg-orange-500/5 border-orange-500/20">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Star size={16} className="text-orange-500" />
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">Your Score</h3>
                    </div>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={userRating}
                        onChange={(e) => {
                            const val = e.target.value === '' ? null : parseInt(e.target.value);
                            if (val === null || (val >= 0 && val <= 100)) {
                                updateRating(val ?? 0);
                            }
                        }}
                        className="w-14 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded py-0.5 px-1 text-sm font-bold text-orange-500 text-center focus:outline-none focus:border-orange-500 transition-colors no-spinner"
                    />
                </div>
                <div className="hidden md:block">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={typeof userRating === 'number' ? userRating : 0}
                        onChange={(e) => updateRating(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-orange-500 mb-2"
                    />
                    <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-medium">
                        <span>0</span>
                        <span>50</span>
                        <span>100</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
