import React from 'react';
import { Eye, EyeOff, Hash, X, MoreVertical } from 'lucide-react';

interface SpoilerControlsProps {
    phaseVisibility: Record<string, 'hidden' | 'normal' | 'revealed'>;
    setPhaseVisibility: (phase: string, visibility: 'hidden' | 'normal' | 'revealed') => void;
    setAllPhaseVisibility: (visibility: 'hidden' | 'normal' | 'revealed') => void;
    customTags: string[];
    showSpoilerDefaults: boolean;
    setShowSpoilerDefaults: (show: boolean) => void;
    spoilerDefaults: Record<string, 'hidden' | 'normal' | 'revealed'>;
    setSpoilerDefault: (phase: string, visibility: 'hidden' | 'normal' | 'revealed') => void;
}

export const SpoilerDefaultsModal: React.FC<Pick<SpoilerControlsProps, 'showSpoilerDefaults' | 'setShowSpoilerDefaults' | 'spoilerDefaults' | 'setSpoilerDefault'>> = ({
    showSpoilerDefaults,
    setShowSpoilerDefaults,
    spoilerDefaults,
    setSpoilerDefault,
}) => {
    if (!showSpoilerDefaults) return null;

    const phases = [
        { id: 'nose', label: 'Nose' },
        { id: 'palate', label: 'Palate' },
        { id: 'texture', label: 'Texture' },
        { id: 'finish', label: 'Finish' },
        { id: 'untagged', label: 'Untagged' }
    ];

    return (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="card w-full max-w-md p-6 border-purple-500/30 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Eye size={20} className="text-purple-500" />
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">Default Spoiler Settings</h3>
                    </div>
                    <button onClick={() => setShowSpoilerDefaults(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <X size={20} />
                    </button>
                </div>

                <p className="text-sm text-[var(--text-secondary)] mb-4">
                    These settings will apply when you join new sessions.
                </p>

                <div className="space-y-4">
                    {phases.map((p) => (
                        <div key={p.id} className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${p.id === 'nose' ? 'text-orange-500' :
                                    p.id === 'palate' ? 'text-blue-500' :
                                        p.id === 'texture' ? 'text-emerald-500' :
                                            p.id === 'finish' ? 'text-purple-500' :
                                                'text-[var(--text-secondary)]'
                                    }`}>{p.label}</span>
                                <span className="text-[9px] text-[var(--text-muted)] uppercase">Default</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--bg-input)] rounded-md border border-[var(--border-primary)]">
                                {[
                                    { id: 'hidden', label: 'Hide', icon: EyeOff },
                                    { id: 'normal', label: 'Auto', icon: Hash },
                                    { id: 'revealed', label: 'Show', icon: Eye }
                                ].map((v) => {
                                    const isActive = (spoilerDefaults[p.id] || 'normal') === v.id;
                                    const Icon = v.icon;
                                    return (
                                        <button
                                            key={v.id}
                                            onClick={() => setSpoilerDefault(p.id, v.id as any)}
                                            className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-[9px] font-bold uppercase transition-all ${isActive
                                                ? (p.id === 'nose' ? 'bg-orange-500 text-white shadow-sm' :
                                                    p.id === 'palate' ? 'bg-blue-500 text-white shadow-sm' :
                                                        p.id === 'texture' ? 'bg-emerald-500 text-white shadow-sm' :
                                                            p.id === 'finish' ? 'bg-purple-500 text-white shadow-sm' :
                                                                'bg-[var(--text-secondary)] text-white shadow-sm')
                                                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-main)]'
                                                }`}
                                        >
                                            <Icon size={10} />
                                            {v.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={() => setShowSpoilerDefaults(false)}
                        className="btn-orange"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export const SpoilerControlsPanel: React.FC<SpoilerControlsProps> = ({
    phaseVisibility,
    setPhaseVisibility,
    setAllPhaseVisibility,
    customTags,
    setShowSpoilerDefaults,
}) => {
    const categories = [
        { id: 'nose', label: 'Nose', color: 'orange' },
        { id: 'palate', label: 'Palate', color: 'blue' },
        { id: 'texture', label: 'Texture', color: 'emerald' },
        { id: 'finish', label: 'Finish', color: 'purple' },
        ...customTags.map(tag => ({ id: tag, label: tag, color: 'pink' })),
        { id: 'untagged', label: 'Untagged', color: 'gray' }
    ];

    return (
        <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Eye size={16} className="text-purple-500" />
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Spoiler Controls</h3>
                </div>
                <button
                    onClick={() => setShowSpoilerDefaults(true)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-purple-500 hover:bg-purple-500/10 rounded transition-colors"
                    title="Set default spoiler visibility"
                >
                    <MoreVertical size={14} />
                </button>
            </div>
            <div className="space-y-4">
                {categories.map((p) => (
                    <div key={p.id} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${p.id === 'nose' ? 'text-orange-500' :
                                p.id === 'palate' ? 'text-blue-500' :
                                    p.id === 'texture' ? 'text-emerald-500' :
                                        p.id === 'finish' ? 'text-purple-500' :
                                            customTags.includes(p.id) ? 'text-pink-500' :
                                                'text-[var(--text-secondary)]'
                                }`}>{p.label}</span>
                            <span className="text-[9px] text-[var(--text-muted)] uppercase">Visibility</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--bg-input)] rounded-md border border-[var(--border-primary)]">
                            {[
                                { id: 'hidden', label: 'Hide', icon: EyeOff },
                                { id: 'normal', label: 'Auto', icon: Hash },
                                { id: 'revealed', label: 'Show', icon: Eye }
                            ].map((v) => {
                                const currentVal = phaseVisibility[p.id] || 'normal';
                                const isActive = currentVal === v.id;
                                const Icon = v.icon;
                                return (
                                    <button
                                        key={v.id}
                                        onClick={() => setPhaseVisibility(p.id, v.id as any)}
                                        className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-[9px] font-bold uppercase transition-all ${isActive
                                            ? (p.id === 'nose' ? 'bg-orange-500 text-white shadow-sm' :
                                                p.id === 'palate' ? 'bg-blue-500 text-white shadow-sm' :
                                                    p.id === 'texture' ? 'bg-emerald-500 text-white shadow-sm' :
                                                        p.id === 'finish' ? 'bg-purple-500 text-white shadow-sm' :
                                                            customTags.includes(p.id) ? 'bg-pink-500 text-white shadow-sm' :
                                                                'bg-[var(--text-secondary)] text-white shadow-sm')
                                            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-main)]'
                                            }`}
                                    >
                                        <Icon size={10} />
                                        {v.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--border-primary)] space-y-4">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">All Categories</span>
                        <span className="text-[9px] text-[var(--text-muted)] uppercase">Master Control</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--bg-input)] rounded-md border border-[var(--border-primary)]">
                        {[
                            { id: 'hidden', label: 'Hide', icon: EyeOff },
                            { id: 'normal', label: 'Auto', icon: Hash },
                            { id: 'revealed', label: 'Show', icon: Eye }
                        ].map((v) => {
                            const allMatch = categories.every(cat => (phaseVisibility[cat.id] || 'normal') === v.id);
                            const Icon = v.icon;
                            return (
                                <button
                                    key={v.id}
                                    onClick={() => setAllPhaseVisibility(v.id as any)}
                                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-[9px] font-bold uppercase transition-all ${allMatch
                                        ? 'bg-orange-500 text-white shadow-sm'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-main)]'
                                        }`}
                                >
                                    <Icon size={10} />
                                    {v.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <p className="mt-4 text-[9px] text-[var(--text-muted)] leading-relaxed italic">
                "Auto" respects individual message spoilers. "Hide" forces all messages of that phase into spoilers. "Show" reveals everything.
            </p>
        </div>
    );
};
