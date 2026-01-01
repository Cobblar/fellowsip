import React from 'react';
import { Zap, Lock, Award } from 'lucide-react';
import { ValueGradeDistribution } from '../ValueGradeSelector';

interface GroupSynthesisProps {
    summary: any;
    publicMode: boolean;
    participants: any[];
}

export const GroupSynthesis: React.FC<GroupSynthesisProps> = ({
    summary,
    publicMode,
    participants,
}) => {
    const avgRating = Math.round(participants.reduce((acc, p) => acc + (p.rating || 0), 0) / (participants.filter(p => p.rating !== null).length || 1));

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                    <Zap size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Shared Summary</h2>
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

            <div className="grid grid-cols-2 gap-4">
                <div className="card p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Avg Rating</p>
                    <p className="text-2xl font-black text-[var(--text-primary)]">{avgRating}</p>
                </div>
                <div className="card p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Tasters</p>
                    <p className="text-2xl font-black text-[var(--text-primary)]">{participants.length}</p>
                </div>
            </div>

            {summary.valueGradeDistribution && Object.values(summary.valueGradeDistribution).some((v: any) => v > 0) && (
                <div className="card p-6 flex flex-col items-center justify-center text-center bg-blue-500/5 border-blue-500/20">
                    <div className="flex items-center gap-2 mb-4">
                        <Award size={16} className="text-blue-500" />
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Value Grade Distribution</p>
                    </div>
                    <ValueGradeDistribution distribution={summary.valueGradeDistribution} />
                </div>
            )}
        </div>
    );
};
