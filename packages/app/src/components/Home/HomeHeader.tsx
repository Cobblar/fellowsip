import React from 'react';
import { Hash, Plus } from 'lucide-react';

interface HomeHeaderProps {
    showJoinInput: boolean;
    setShowJoinInput: (show: boolean) => void;
    joinSessionId: string;
    setJoinSessionId: (id: string) => void;
    onJoinById: () => void;
    onCreateSession: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
    showJoinInput,
    setShowJoinInput,
    joinSessionId,
    setJoinSessionId,
    onJoinById,
    onCreateSession,
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h1 className="heading-xl">Welcome Back</h1>
            <div className="flex items-center gap-2">
                {showJoinInput ? (
                    <div className="flex items-center gap-2 flex-1 md:flex-none">
                        <div className="relative flex-1 md:w-64">
                            <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                            <input
                                type="text"
                                placeholder="Paste session ID..."
                                value={joinSessionId}
                                onChange={(e) => setJoinSessionId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && onJoinById()}
                                className="pl-9 pr-3 py-2 bg-[var(--bg-input)] border-[var(--border-primary)] text-sm w-full font-mono"
                                autoFocus
                            />
                        </div>
                        <button
                            onClick={onJoinById}
                            disabled={!joinSessionId.trim()}
                            className="btn-orange text-sm py-2 px-4"
                        >
                            Join
                        </button>
                        <button
                            onClick={() => { setShowJoinInput(false); setJoinSessionId(''); }}
                            className="text-[var(--text-secondary)] hover:text-white text-sm px-2"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowJoinInput(true)}
                        className="btn-outline w-full md:w-auto justify-center"
                    >
                        Join by ID
                    </button>
                )}
                <button
                    onClick={onCreateSession}
                    className="btn-orange w-full md:w-auto justify-center"
                >
                    <Plus size={16} />
                    New Session
                </button>
            </div>
        </div>
    );
};
