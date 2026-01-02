import React from 'react';
import { MessageSquare, Edit2, X, Save, Users, Globe, Lock, Star, ChevronRight, Award } from 'lucide-react';
import { UserAvatar } from '../UserAvatar';

interface TastingNoteProps {
    summary: any;
    currentUser: any;
    selectedMemberId: string | null;
    setSelectedMemberId: (id: string | null) => void;
    isEditingNotes: boolean;
    setIsEditingNotes: (editing: boolean) => void;
    editData: any;
    setEditData: (data: any) => void;
    participants: any[];
    publicMode: boolean;
    onEdit: () => void;
    onSave: () => void;
    onTasterClick: (userId: string) => void;
    isSolo?: boolean;
}

export const TastingNote: React.FC<TastingNoteProps> = ({
    summary,
    currentUser,
    selectedMemberId,
    setSelectedMemberId,
    isEditingNotes,
    setIsEditingNotes,
    editData,
    setEditData,
    participants,
    publicMode,
    onEdit,
    onSave,
    onTasterClick,
    isSolo,
}) => {
    const selectedTaster = summary.tasterSummaries?.find((s: any) => s.userId === (selectedMemberId || currentUser?.id));
    const selectedRating = participants.find(p => p.userId === (selectedMemberId || currentUser?.id))?.rating;

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                    <MessageSquare size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Individual Tasting Notes</h2>
                </div>
            </div>

            <div className="card p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 flex gap-4">
                    {selectedRating !== undefined && selectedRating !== null && (
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">Rating</span>
                            <div className="text-3xl font-black text-[var(--text-primary)] flex items-baseline gap-1">
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
                                    selectedRating ?? '--'
                                )}
                            </div>
                        </div>
                    )}
                    {participants.find(p => p.userId === (selectedMemberId || currentUser?.id))?.valueGrade && (
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Value</span>
                            <div className="text-3xl font-black text-[var(--text-primary)] flex items-baseline gap-1">
                                {participants.find(p => p.userId === (selectedMemberId || currentUser?.id))?.valueGrade}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-orange-500">Notes</h3>
                        {!publicMode && selectedMemberId === currentUser?.id && (
                            <button
                                onClick={onEdit}
                                className="p-1 hover:bg-[var(--bg-input)] rounded transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            >
                                <Edit2 size={12} />
                            </button>
                        )}
                    </div>

                    {!selectedTaster && !isEditingNotes ? (
                        <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg text-center">
                            <p className="text-sm text-[var(--text-secondary)] mb-2">
                                {selectedMemberId
                                    ? "This participant's notes were not captured in the AI summary."
                                    : "No personalized profile found."}
                            </p>
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
                                        {selectedTaster?.observations || 'No observations recorded.'}
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
                                                {selectedTaster?.[key] || `No ${label.toLowerCase()} notes recorded.`}
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
                                    <button onClick={onSave} className="btn-orange flex items-center gap-2">
                                        <Save size={16} /> Save Notes
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {!isSolo && (
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                        <Users size={14} />
                        Individual Tasters
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        {participants
                            .filter((p: any) => {
                                if (publicMode) return p.sharePersonalSummary;
                                return true;
                            })
                            .reduce((acc: any[], current: any) => {
                                if (!acc.find(p => p.userId === current.userId)) {
                                    acc.push(current);
                                }
                                return acc;
                            }, [])
                            .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
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
                                                            onTasterClick(taster.userId);
                                                        }}
                                                        className="cursor-pointer hover:scale-105 transition-transform"
                                                    >
                                                        <UserAvatar
                                                            avatarUrl={taster.avatarUrl}
                                                            displayName={taster.displayName}
                                                            userId={taster.userId}
                                                            useGeneratedAvatar={taster.useGeneratedAvatar}
                                                            size="sm"
                                                        />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="flex items-center gap-2">
                                                            <p
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onTasterClick(taster.userId);
                                                                }}
                                                                className="text-sm font-bold text-[var(--text-primary)] cursor-pointer hover:text-orange-500 transition-colors"
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
                                                    {taster.valueGrade && (
                                                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded text-xs font-bold text-blue-500">
                                                            <Award size={12} />
                                                            {taster.valueGrade}
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
            )}
        </div>
    );
};
