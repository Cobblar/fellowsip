import React from 'react';
import { ChevronLeft, Users, Hash, Copy, Check, Star, Link2, Zap, Loader2, MoreVertical, Monitor, Eye, EyeOff, Bug, Ban, BarChart3 } from 'lucide-react';

interface ChatHeaderProps {
    session: any;
    id: string | undefined;
    activeUsers: any[];
    averageRating: number | null;
    onNavigateBack: () => void;
    onOpenTastersSidebar: () => void;
    onCopySessionId: () => void;
    copied: 'id' | 'link' | null;
    onCopyJoinLink: () => void;
    isHost: boolean;
    summaryId: string | null;
    isSessionEnded: boolean;
    onAnalyze: () => void;
    isEnding: boolean;
    onViewSummary: () => void;
    isActionsOpen: boolean;
    setIsActionsOpen: (open: boolean) => void;
    actionsRef: React.RefObject<HTMLDivElement>;
    showStreamInput: boolean;
    setShowStreamInput: (show: boolean) => void;
    streamInputValue: string;
    setStreamInputValue: (value: string) => void;
    onUpdateLivestream: () => void;
    livestreamUrl: string | null;
    onRevealAllSpoilers: () => void;
    onShowSpoilerDefaults: () => void;
    onInjectDebugHistory: () => void;
    onShowEndModal: () => void;
    onOpenSummarySidebar: () => void;
    currentUserId: string | null;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    session,
    id,
    activeUsers,
    averageRating,
    onNavigateBack,
    onOpenTastersSidebar,
    onCopySessionId,
    copied,
    onCopyJoinLink,
    isHost,
    summaryId,
    isSessionEnded,
    onAnalyze,
    isEnding,
    onViewSummary,
    isActionsOpen,
    setIsActionsOpen,
    actionsRef,
    showStreamInput,
    setShowStreamInput,
    streamInputValue,
    setStreamInputValue,
    onUpdateLivestream,
    livestreamUrl,
    onRevealAllSpoilers,
    onShowSpoilerDefaults,
    onInjectDebugHistory,
    onShowEndModal,
    onOpenSummarySidebar,
    currentUserId,
}) => {
    return (
        <header className="border-bottom border-[var(--border-primary)] flex items-center justify-between px-4 md:px-6 py-3 bg-[var(--bg-main)]">
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                <button
                    onClick={onNavigateBack}
                    className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] md:hidden flex-shrink-0"
                    title="Back to Home"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={onOpenTastersSidebar}
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] md:hidden flex-shrink-0"
                >
                    <Users size={20} />
                </button>
                <div className="min-w-0">
                    <h1 className="text-sm md:text-lg font-bold text-[var(--text-primary)] truncate">{session?.name}</h1>
                    <div className="flex items-center gap-2 md:gap-3 mt-0.5">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500"></span>
                            <span className="text-[10px] md:text-xs text-[var(--text-secondary)]">{activeUsers.length} Taster{activeUsers.length !== 1 ? 's' : ''}</span>
                        </div>
                        <span className="text-[var(--text-muted)] hidden md:inline">•</span>
                        <div className="hidden md:flex items-center gap-1.5">
                            <Hash size={10} className="text-[var(--text-muted)]" />
                            <span className="text-xs text-[var(--text-secondary)] font-mono">{id?.slice(0, 8)}...</span>
                            <button
                                onClick={onCopySessionId}
                                className="text-[var(--text-secondary)] hover:text-orange-500 transition-colors"
                                title="Copy Session ID"
                            >
                                {copied === 'id' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                            </button>
                        </div>
                        {averageRating !== null && (
                            <>
                                <span className="text-[var(--text-muted)]">•</span>
                                <div className="flex items-center gap-1.5">
                                    <Star size={10} className="text-orange-500 fill-orange-500 md:w-3 md:h-3" />
                                    <span className="text-[10px] md:text-xs font-bold text-[var(--text-primary)]">{averageRating.toFixed(1)} Avg</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
                <button
                    onClick={onCopyJoinLink}
                    className="p-2 text-[var(--text-secondary)] hover:text-orange-500 hover:bg-[var(--bg-input)]/50 rounded-lg transition-all"
                    title={copied === 'link' ? 'Copied!' : 'Copy Join Link'}
                >
                    {copied === 'link' ? <Check size={18} className="text-green-500" /> : <Link2 size={18} />}
                </button>

                {isHost && !summaryId && !isSessionEnded && (
                    <button
                        onClick={onAnalyze}
                        disabled={isEnding}
                        className="btn-orange text-[10px] md:text-xs py-1.5 md:py-2 px-2 md:px-4 shadow-lg shadow-orange-500/10"
                    >
                        {isEnding ? (
                            <Loader2 size={14} className="animate-spin md:mr-2" />
                        ) : (
                            <Zap size={14} className="md:mr-2" />
                        )}
                        <span className="hidden md:inline text-center leading-tight">{isEnding ? 'Creating Notes...' : <>Create Tasting Notes<br />&amp; End Session</>}</span>
                    </button>
                )}

                {(summaryId || isSessionEnded) && (
                    <button
                        onClick={onViewSummary}
                        className="btn-orange text-[10px] md:text-xs py-1.5 md:py-2 px-2 md:px-4 shadow-lg shadow-orange-500/10"
                    >
                        <Zap size={14} className="md:mr-2" />
                        <span className="hidden md:inline">View Summary</span>
                    </button>
                )}

                {isHost && (
                    <div className="relative" ref={actionsRef}>
                        <button
                            onClick={() => setIsActionsOpen(!isActionsOpen)}
                            className={`p-2 rounded-lg transition-all ${isActionsOpen ? 'bg-[var(--bg-input)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]/50'}`}
                            title="Session Actions"
                        >
                            <MoreVertical size={18} />
                        </button>

                        {isActionsOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-2 space-y-1">
                                    {showStreamInput ? (
                                        <div className="px-3 py-2 space-y-2">
                                            <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Livestream URL</p>
                                            <input
                                                type="text"
                                                value={streamInputValue}
                                                onChange={(e) => setStreamInputValue(e.target.value)}
                                                placeholder="YouTube or Twitch URL"
                                                className="w-full px-2 py-1.5 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded text-xs text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                                                autoFocus
                                            />
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={onUpdateLivestream}
                                                    className="flex-1 py-1 bg-orange-500 text-white text-xs font-bold rounded hover:bg-orange-600"
                                                >
                                                    Set
                                                </button>
                                                <button
                                                    onClick={() => setShowStreamInput(false)}
                                                    className="px-2 py-1 bg-[var(--bg-input)] text-[var(--text-secondary)] text-xs font-bold rounded hover:bg-[var(--bg-main)]"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setShowStreamInput(true);
                                                setStreamInputValue(livestreamUrl || '');
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] rounded-md transition-colors"
                                        >
                                            <Monitor size={16} />
                                            {livestreamUrl ? 'Update Livestream' : 'Add Livestream'}
                                        </button>
                                    )}

                                    <button
                                        onClick={() => {
                                            onRevealAllSpoilers();
                                            setIsActionsOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] rounded-md transition-colors"
                                    >
                                        <Eye size={16} />
                                        Reveal All Spoilers
                                    </button>

                                    <button
                                        onClick={() => {
                                            onShowSpoilerDefaults();
                                            setIsActionsOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] rounded-md transition-colors"
                                    >
                                        <EyeOff size={16} />
                                        Spoiler Defaults
                                    </button>

                                    {currentUserId === '108758497007070939011' && (
                                        <button
                                            onClick={() => {
                                                onInjectDebugHistory();
                                                setIsActionsOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-md transition-colors"
                                        >
                                            <Bug size={16} />
                                            Inject Debug History
                                        </button>
                                    )}

                                    <div className="h-px bg-[var(--border-primary)] my-1" />

                                    <button
                                        onClick={() => {
                                            onShowEndModal();
                                            setIsActionsOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
                                    >
                                        <Ban size={16} />
                                        End Session
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={onOpenSummarySidebar}
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] md:hidden"
                >
                    <BarChart3 size={20} />
                </button>
            </div>
        </header>
    );
};
