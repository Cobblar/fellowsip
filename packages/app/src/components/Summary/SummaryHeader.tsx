import React from 'react';
import { Wine, Globe, Calendar, MessageSquare, Share2 } from 'lucide-react';

interface SummaryHeaderProps {
    session: any;
    publicMode: boolean;
    onViewSessionLog: () => void;
    onCopyPublicLink: () => void;
}

export const SummaryHeader: React.FC<SummaryHeaderProps> = ({
    session,
    publicMode,
    onViewSessionLog,
    onCopyPublicLink,
}) => {
    return (
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
                        onClick={onViewSessionLog}
                        className="btn-secondary text-xs py-2"
                    >
                        <MessageSquare size={14} />
                        View Session Log
                    </button>
                    <button
                        onClick={onCopyPublicLink}
                        className="btn-secondary text-xs py-2"
                    >
                        <Share2 size={14} />
                        Copy Public Link
                    </button>
                </div>
            )}
        </div>
    );
};
