import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, Check, X } from 'lucide-react';

interface ProductDescriptionProps {
    description: string | null;
    editable: boolean;
    onSave: (description: string) => void;
}

export function ProductDescription({ description, editable, onSave }: ProductDescriptionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(description || '');

    if (!description && !editable) return null;

    const handleSave = () => {
        onSave(editValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(description || '');
        setIsEditing(false);
    };

    const toggleExpand = () => {
        if (!isEditing) {
            setIsExpanded(!isExpanded);
        }
    };

    return (
        <div className="mb-8 max-w-2xl mx-auto">
            <div className={`card overflow-hidden transition-all duration-300 ${isExpanded ? 'p-6' : 'p-4 cursor-pointer hover:bg-[var(--bg-card-hover)]'}`}
                onClick={toggleExpand}>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">Product Info</span>
                            {!isExpanded && description && (
                                <span className="text-xs text-[var(--text-secondary)] italic truncate max-w-md">
                                    {description}
                                </span>
                            )}
                        </div>

                        {isExpanded && (
                            <div className="mt-4">
                                {isEditing ? (
                                    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                                        <textarea
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="w-full bg-[var(--bg-main)] border-[var(--border-primary)] text-sm p-3 rounded-lg min-h-[100px] focus:ring-2 focus:ring-orange-500 outline-none"
                                            placeholder="Enter product description..."
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={handleCancel} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Cancel">
                                                <X size={18} />
                                            </button>
                                            <button onClick={handleSave} className="p-2 text-green-500 hover:text-green-400" title="Save">
                                                <Check size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative group">
                                        <p className="text-sm text-[var(--text-primary)] leading-relaxed italic">
                                            {description || 'No description available.'}
                                        </p>
                                        {editable && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsEditing(true);
                                                }}
                                                className="absolute -top-2 -right-2 p-2 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-full text-[var(--text-secondary)] hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                title="Edit Description"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="text-[var(--text-muted)] mt-1">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                </div>
            </div>
        </div>
    );
}
