import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy, Star, MessageSquare } from 'lucide-react';
import { useComparisonSummary, useSession } from '../api/sessions';
import { getProductIcon } from '../utils/productIcons';

export function ComparisonSummary() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: sessionData } = useSession(id || '');
    const { data: comparisonData, isLoading } = useComparisonSummary(id || '');

    const session = sessionData?.session;
    const comparison = comparisonData?.comparison;

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-[var(--bg-main)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (!comparison) {
        return (
            <div className="p-8 text-center bg-[var(--bg-main)] h-full">
                <h2 className="heading-lg mb-2">Comparison Not Found</h2>
                <p className="text-[var(--text-secondary)] mb-6">This session may not have a comparison summary yet.</p>
                <button onClick={() => navigate(-1)} className="btn-orange">Go Back</button>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[var(--bg-main)] p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-8 transition-colors group"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold uppercase tracking-widest text-xs">Back to Summary</span>
                </button>

                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                            <Trophy size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Side-by-Side Comparison</h1>
                            <p className="text-[var(--text-secondary)]">{session?.name}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {/* Comparative Notes */}
                    <section className="card p-8 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-main)] border-[var(--border-primary)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <MessageSquare size={120} />
                        </div>
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500 mb-6 flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-orange-500/30"></span>
                            The Big Picture
                        </h2>
                        <p className="text-lg text-[var(--text-primary)] leading-relaxed italic font-medium">
                            "{comparison.comparativeNotes}"
                        </p>
                    </section>

                    {/* Rankings */}
                    <section className="space-y-6">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-8 flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-[var(--border-primary)]"></span>
                            Final Rankings
                        </h2>

                        <div className="grid grid-cols-1 gap-4">
                            {comparison.rankings?.sort((a: any, b: any) => a.rank - b.rank).map((ranking: any, index: number) => {
                                const product = session?.products?.find((p: any) => p.index === ranking.productIndex);
                                return (
                                    <div key={index} className="card p-6 flex items-start gap-6 hover:border-orange-500/30 transition-all group">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-lg ${ranking.rank === 1
                                                ? 'bg-yellow-500 text-white shadow-yellow-500/20'
                                                : ranking.rank === 2
                                                    ? 'bg-slate-400 text-white shadow-slate-400/20'
                                                    : 'bg-amber-700 text-white shadow-amber-700/20'
                                            }`}>
                                            {ranking.rank}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-2xl">{getProductIcon(product?.productType || '')}</span>
                                                <h3 className="text-xl font-bold text-[var(--text-primary)] truncate">
                                                    {product?.productName || `Product ${ranking.productIndex + 1}`}
                                                </h3>
                                            </div>
                                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                                {ranking.notes}
                                            </p>
                                        </div>

                                        {ranking.rank === 1 && (
                                            <div className="hidden md:flex items-center gap-1 text-yellow-500">
                                                <Star size={16} fill="currentColor" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Winner</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
