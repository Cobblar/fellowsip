import { useNavigate } from 'react-router-dom';
import { Archive as ArchiveIcon, ArrowLeft, Clock, RefreshCw } from 'lucide-react';
import { useArchivedSessions, useUnarchiveSession } from '../api/sessions';
import { getProductIcon } from '../utils/productIcons';

export function Archive() {
    const navigate = useNavigate();
    const { data, isLoading } = useArchivedSessions();
    const unarchiveSession = useUnarchiveSession();

    const archivedSessions = data?.sessions || [];

    const handleUnarchive = async (sessionId: string) => {
        try {
            await unarchiveSession.mutateAsync(sessionId);
        } catch (error) {
            console.error('Failed to unarchive session:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/profile')}
                    className="p-2 rounded-lg hover:bg-[var(--bg-input)] transition-colors"
                >
                    <ArrowLeft size={20} className="text-[var(--text-secondary)]" />
                </button>
                <div>
                    <h1 className="heading-xl">Archived Sessions</h1>
                    <p className="text-sm text-[var(--text-secondary)]">Sessions you've archived for later reference</p>
                </div>
            </div>

            {archivedSessions.length === 0 ? (
                <div className="card p-8 md:p-12 text-center">
                    <ArchiveIcon size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
                    <h2 className="text-lg font-medium text-[var(--text-secondary)] mb-2">No Archived Sessions</h2>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                        Sessions you archive will appear here. Archive sessions to declutter your tasting history.
                    </p>
                    <button
                        onClick={() => navigate('/summaries')}
                        className="btn-outline w-full sm:w-auto"
                    >
                        Go to Sessions
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {archivedSessions.map((session) => {
                        const productEmoji = getProductIcon(session.productType);
                        return (
                            <div
                                key={session.id}
                                className="card p-4 md:p-6 hover:border-[var(--border-secondary)] transition-colors"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        {/* Product Icon */}
                                        <div className="w-12 h-12 rounded-xl bg-[var(--bg-input)]/50 flex items-center justify-center shrink-0 text-2xl">
                                            {productEmoji}
                                        </div>

                                        {/* Session Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-medium text-[var(--text-primary)] truncate">
                                                {session.name}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-[var(--text-secondary)]">{session.productType || 'Tasting'}</span>
                                                <span className="text-[var(--text-muted)]">•</span>
                                                <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                                                    <Clock size={10} />
                                                    {new Date(session.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 sm:ml-auto">
                                        <button
                                            onClick={() => handleUnarchive(session.id)}
                                            disabled={unarchiveSession.isPending}
                                            className="btn-outline text-xs py-1.5 flex-1 sm:flex-none flex items-center justify-center gap-1.5"
                                        >
                                            <RefreshCw size={12} />
                                            Restore
                                        </button>
                                        {session.summaryId && (
                                            <button
                                                onClick={() => navigate(`/session/${session.id}/summary`)}
                                                className="btn-outline text-xs py-1.5 flex-1 sm:flex-none justify-center"
                                            >
                                                View Summary
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
