import { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import type { Message } from '../types';

interface SoloNoteGridProps {
    messages: Message[];
    spaceOutByTime: boolean;
    customTags: string[];
    activeProductIndex: number;
    onEditMessage?: (id: string, content: string) => void;
    onDeleteMessage?: (id: string) => void;
}

const DEFAULT_PHASES = [
    { id: 'nose', label: 'Nose', icon: '👃' },
    { id: 'palate', label: 'Palate', icon: '👅' },
    { id: 'texture', label: 'Texture', icon: '👄' },
    { id: 'finish', label: 'Finish', icon: '✨' },
    { id: 'untagged', label: 'Other', icon: '📝' },
];

export function SoloNoteGrid({
    messages,
    spaceOutByTime,
    customTags,
    activeProductIndex,
    onEditMessage,
    onDeleteMessage,
}: SoloNoteGridProps) {
    const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
        new Set(['nose', 'palate', 'texture', 'finish', 'untagged'])
    );
    const bottomRef = useRef<HTMLDivElement>(null);

    // Filter messages for the active product
    const productMessages = useMemo(() =>
        messages.filter(m => m.productIndex === activeProductIndex || m.productIndex === undefined),
        [messages, activeProductIndex]
    );

    // Auto-expand logic when a new note is added
    useEffect(() => {
        if (productMessages.length > 0) {
            const latestMessage = productMessages[productMessages.length - 1];
            const phase = latestMessage.phase || 'untagged';
            setExpandedPhases(prev => new Set([...prev, phase]));

            // Scroll to bottom when new message arrives
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [productMessages.length]);

    const phases = useMemo(() => {
        const allPhases = [...DEFAULT_PHASES];
        customTags.forEach(tag => {
            if (!allPhases.find(p => p.id === tag)) {
                allPhases.push({ id: tag, label: tag, icon: '🏷️' });
            }
        });
        return allPhases;
    }, [customTags]);

    const togglePhase = (phaseId: string) => {
        setExpandedPhases(prev => {
            const next = new Set(prev);
            if (next.has(phaseId)) {
                next.delete(phaseId);
            } else {
                next.add(phaseId);
            }
            return next;
        });
    };

    // Group messages by phase for the grid
    const messagesByPhase = useMemo(() => {
        const grouped: Record<string, Message[]> = {};
        phases.forEach(p => grouped[p.id] = []);
        productMessages.forEach(m => {
            const phase = m.phase || 'untagged';
            if (grouped[phase]) {
                grouped[phase].push(m);
            } else {
                // If it's a custom tag not in phases yet
                grouped['untagged'].push(m);
            }
        });
        return grouped;
    }, [productMessages, phases]);

    // For "Space out by time" mode, we need a chronological list of "rows"
    const rows = useMemo(() => {
        if (!spaceOutByTime) return [];
        // Each message gets its own row
        return [...productMessages].sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    }, [productMessages, spaceOutByTime]);

    return (
        <div className="solo-notebook min-h-full">
            {/* Desktop Grid View */}
            <div className="hidden md:block">
                {/* Sticky Header Row */}
                <div
                    className="sticky top-0 z-10 grid border-t border-l border-b border-[var(--border-primary)]/50 bg-[var(--bg-card)] shadow-sm"
                    style={{ gridTemplateColumns: `repeat(${phases.length}, minmax(0, 1fr))` }}
                >
                    {phases.map(phase => (
                        <div
                            key={phase.id}
                            className="p-2 text-center border-r border-[var(--border-primary)]/50"
                        >
                            <span className="solo-phase-header text-[10px] uppercase tracking-[0.15em] text-orange-500 flex items-center justify-center gap-1.5">
                                <span className="text-sm opacity-80">{phase.icon}</span>
                                {phase.label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Notes Grid */}
                <div
                    className="grid border-l border-[var(--border-primary)]/50 bg-[var(--bg-main)]"
                    style={{ gridTemplateColumns: `repeat(${phases.length}, minmax(0, 1fr))` }}
                >
                    {spaceOutByTime ? (
                        // Chronological rows
                        rows.map((msg) => (
                            <div key={msg.id} className="contents">
                                {phases.map((phase, pIdx) => {
                                    const isMatch = (msg.phase || 'untagged') === phase.id;
                                    return (
                                        <div
                                            key={`${msg.id}-${phase.id}`}
                                            className={`min-h-[1.25rem] p-1 md:p-1.5 relative group solo-note ${pIdx < phases.length - 1 ? 'border-r border-[var(--border-primary)]/10' : ''} ${!isMatch ? 'solo-note-empty-tinge' : ''}`}
                                        >
                                            {isMatch && (
                                                <NoteContent
                                                    message={msg}
                                                    onEdit={onEditMessage}
                                                    onDelete={onDeleteMessage}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    ) : (
                        // Compact columns
                        <div className="contents">
                            {phases.map((phase, pIdx) => (
                                <div key={phase.id} className={`min-h-[20rem] flex flex-col ${pIdx < phases.length - 1 ? 'border-r border-[var(--border-primary)]/20' : ''}`}>
                                    {messagesByPhase[phase.id].map((msg, idx) => (
                                        <div key={msg.id} className="p-1.5 relative group solo-note">
                                            {idx > 0 && <div className="solo-note-divider mb-1.5" />}
                                            <NoteContent
                                                message={msg}
                                                onEdit={onEditMessage}
                                                onDelete={onDeleteMessage}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Accordion View */}
            <div className="md:hidden space-y-2">
                {phases.map(phase => {
                    const phaseMessages = messagesByPhase[phase.id];
                    const isExpanded = expandedPhases.has(phase.id);
                    const lastMessage = phaseMessages[phaseMessages.length - 1];

                    return (
                        <div key={phase.id} className="border border-[var(--border-primary)]/30 rounded-lg overflow-hidden">
                            <button
                                onClick={() => togglePhase(phase.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-hover)] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{phase.icon}</span>
                                    <span className="solo-phase-header text-xs uppercase tracking-widest text-orange-500">
                                        {phase.label}
                                    </span>
                                    <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-input)] px-2 py-0.5 rounded-full">
                                        {phaseMessages.length}
                                    </span>
                                </div>
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>

                            {!isExpanded && lastMessage && (
                                <div className="px-4 pb-4 pt-0">
                                    <div className="solo-note-divider mb-3" />
                                    <p className="solo-note-text text-sm text-[var(--text-secondary)] line-clamp-1 italic opacity-70">
                                        {lastMessage.content}
                                    </p>
                                </div>
                            )}

                            {isExpanded && (
                                <div className="px-4 pb-4 space-y-4">
                                    <div className="solo-note-divider" />
                                    {phaseMessages.length === 0 ? (
                                        <p className="text-[10px] text-[var(--text-muted)] italic py-2">No notes yet.</p>
                                    ) : (
                                        phaseMessages.map((msg, idx) => (
                                            <div key={msg.id} className="relative group solo-note">
                                                {idx > 0 && <div className="solo-note-divider mb-4" />}
                                                <NoteContent
                                                    message={msg}
                                                    onEdit={onEditMessage}
                                                    onDelete={onDeleteMessage}
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div ref={bottomRef} />
        </div>
    );
}

function NoteContent({
    message,
    onEdit,
    onDelete
}: {
    message: Message;
    onEdit?: (id: string, content: string) => void;
    onDelete?: (id: string) => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);

    const handleSave = () => {
        onEdit?.(message.id, editContent);
        setIsEditing(false);
    };

    return (
        <div className="relative">
            <div className="flex justify-between items-start">
                <span className="timestamp text-[9px] text-[var(--text-muted)] font-sans">
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-1 text-[var(--text-muted)] hover:text-orange-500 transition-colors"
                    >
                        <Pencil size={12} />
                    </button>
                    <button
                        onClick={() => onDelete?.(message.id)}
                        className="p-1 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {isEditing ? (
                <div className="space-y-1">
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-[var(--bg-input)] border border-orange-500/30 rounded p-1.5 text-xs solo-note-text focus:outline-none focus:border-orange-500"
                        rows={2}
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsEditing(false)} className="text-[9px] uppercase font-bold text-[var(--text-muted)]">Cancel</button>
                        <button onClick={handleSave} className="text-[9px] uppercase font-bold text-orange-500">Save</button>
                    </div>
                </div>
            ) : (
                <div className="flex items-start gap-1.5">
                    <div className="h-[1.1rem] flex items-center flex-shrink-0">
                        <span className="text-orange-500/60 select-none text-[10px]">•</span>
                    </div>
                    <p className="solo-note-text text-xs text-[var(--text-primary)] leading-snug whitespace-pre-wrap">
                        {message.content}
                    </p>
                </div>
            )}
        </div>
    );
}
