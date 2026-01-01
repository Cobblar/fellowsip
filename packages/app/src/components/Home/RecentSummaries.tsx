import React, { useMemo } from 'react';
import { ChevronRight, FileText, Calendar } from 'lucide-react';
import { getProductIcon } from '../../utils/productIcons';

interface RecentSummariesProps {
    summaries: any[];
    onViewAll: () => void;
    onViewSummary: (sessionId: string, productIndex?: number) => void;
}

export const RecentSummaries: React.FC<RecentSummariesProps> = ({
    summaries,
    onViewAll,
    onViewSummary,
}) => {
    // Process summaries to include product-specific data
    const processedSummaries = useMemo(() => {
        return summaries.map((s: any) => {
            const productIndex = s.summary.productIndex || 0;
            const products = s.session.products || [];
            const product = products[productIndex] || {};

            // Use product-specific data, fallback to session-level for legacy single-product sessions
            const productName = product.productName || s.session.productName;
            const productType = product.productType || s.session.productType;

            return {
                session: s.session,
                summary: s.summary,
                productIndex,
                productName,
                productType,
            };
        });
    }, [summaries]);

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">Recent Tastings</h2>
                <button
                    onClick={onViewAll}
                    className="text-xs text-orange-500 hover:underline flex items-center gap-1"
                >
                    View all <ChevronRight size={14} />
                </button>
            </div>
            {processedSummaries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {processedSummaries.slice(0, 3).map((item) => {
                        const productEmoji = getProductIcon(item.productType);
                        return (
                            <div
                                key={`${item.session?.id}-${item.productIndex}`}
                                onClick={() => onViewSummary(item.session?.id, item.productIndex)}
                                className="card hover:border-gray-600 transition-all cursor-pointer group p-5"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[var(--bg-input)] rounded flex items-center justify-center text-xl">
                                            {productEmoji}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--text-primary)] text-sm">
                                                    {item.productName || item.session?.name}
                                                </h3>
                                                {item.session?.startedAt && (new Date().getTime() - new Date(item.session.startedAt).getTime() < 24 * 60 * 60 * 1000) && (
                                                    <span className="text-[8px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">New</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-[var(--text-secondary)]">
                                                {item.productName ? item.session?.name : (item.productType || 'Tasting')}
                                            </p>
                                        </div>
                                    </div>
                                    {(item.summary?.metadata?.rating || item.summary?.averageRating) && (
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-orange-500">{item.summary?.metadata?.rating || item.summary?.averageRating}</span>
                                            <p className="text-[8px] text-[var(--text-muted)] uppercase font-bold">Score</p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1 mb-3 min-h-[40px]">
                                    {item.summary.nose && (
                                        <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1">
                                            <span className="text-[var(--text-muted)] uppercase font-bold mr-1">Nose:</span> {item.summary.nose}
                                        </p>
                                    )}
                                    {item.summary.palate && (
                                        <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1">
                                            <span className="text-[var(--text-muted)] uppercase font-bold mr-1">Palate:</span> {item.summary.palate}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] pt-3 border-t border-[var(--border-primary)]/50">
                                    <Calendar size={12} />
                                    <span>{item.session?.startedAt ? new Date(item.session.startedAt).toLocaleDateString() : ''}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-8 bg-[var(--bg-main)]/30 rounded-lg border border-dashed border-[var(--border-primary)] px-4">
                    <FileText size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
                    <p className="text-sm text-[var(--text-secondary)]">No summaries yet. Complete a tasting session to see your notes here.</p>
                </div>
            )}
        </section>
    );
};
