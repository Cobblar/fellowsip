import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, FileText, Calendar, ChevronRight, ArrowLeft, Star, Search } from 'lucide-react';
import { usePublicProfile } from '../api/auth';
import { getProductIcon } from '../utils/productIcons';

export function PublicProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data, isLoading, isError } = usePublicProfile(id || '');
    const [searchQuery, setSearchQuery] = useState('');

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
                <div className="text-[var(--text-secondary)] animate-pulse">Loading profile...</div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-main)] p-4 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                    <User size={32} className="text-red-500" />
                </div>
                <h1 className="heading-lg mb-2">Profile Not Found</h1>
                <p className="text-[var(--text-secondary)] mb-6">This profile does not exist or has no shared summaries.</p>
                <button
                    onClick={() => window.location.href = import.meta.env.VITE_LANDING_URL || 'http://localhost:4321'}
                    className="btn-orange"
                >
                    Return Home
                </button>
            </div>
        );
    }

    const { user, summaries } = data;

    const filteredSummaries = [...summaries]
        .filter(s =>
            (s.session?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.session?.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.session?.productType || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

    const highlightedSummaries = filteredSummaries.filter(s => s.session?.isHighlighted);
    const regularSummaries = filteredSummaries.filter(s => !s.session?.isHighlighted);

    const SummaryCard = ({ s, featured = false }: { s: any; featured?: boolean }) => {
        const productEmoji = getProductIcon(s.session?.productType);
        return (
            <div
                onClick={() => navigate(`/session/${s.sessionId}/summary/public`)}
                className={`group cursor-pointer transition-all ${featured
                    ? 'bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-transparent border border-yellow-500/20 rounded-2xl p-6 hover:border-yellow-500/40 hover:shadow-lg hover:shadow-yellow-500/5'
                    : 'bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4 hover:border-orange-500/30'
                    }`}
            >
                <div className="flex items-start gap-4">
                    <span className={featured ? 'text-2xl' : 'text-xl'}>
                        {productEmoji}
                    </span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {featured && (
                                <Star size={12} fill="currentColor" className="text-yellow-500 shrink-0" />
                            )}
                            <h3 className={`font-bold truncate transition-colors ${featured
                                ? 'text-base text-white group-hover:text-yellow-500'
                                : 'text-sm text-[var(--text-primary)] group-hover:text-orange-500'
                                }`}>
                                {s.session?.productName || s.session?.name || 'Tasting Session'}
                            </h3>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] truncate mb-2">
                            {s.session?.name || s.session?.productType || 'Tasting'}
                        </p>

                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                                <Calendar size={10} />
                                {new Date(s.createdAt).toLocaleDateString()}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-tight flex items-center gap-0.5 ${featured ? 'text-yellow-500' : 'text-orange-500'
                                }`}>
                                View <ChevronRight size={10} />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            {/* Compact Header */}
            <div className="border-b border-[var(--border-primary)] bg-[var(--bg-card)]/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <ArrowLeft size={14} />
                        <span>Back</span>
                    </button>
                    <div className="flex items-center gap-1.5 opacity-60">
                        <span className="text-xs font-black tracking-tight text-orange-500">FELLOWSIP</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Compact Profile Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-[var(--bg-input)] flex items-center justify-center border-2 border-[var(--border-secondary)] overflow-hidden shrink-0">
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.displayName || ''} className="w-full h-full object-cover" />
                        ) : (
                            <User size={28} className="text-[var(--text-secondary)]" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold text-white truncate">{user.displayName || 'Taster'}</h1>
                        {user.bio && (
                            <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mt-0.5">
                                {user.bio}
                            </p>
                        )}
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                            {summaries.length} shared {summaries.length === 1 ? 'tasting' : 'tastings'}
                        </p>
                    </div>
                </div>

                {/* Featured/Highlighted Section */}
                {highlightedSummaries.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-yellow-500 flex items-center gap-2 mb-4">
                            <Star size={12} fill="currentColor" />
                            Featured Tastings
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {highlightedSummaries.map((s) => (
                                <SummaryCard key={s.id} s={s} featured />
                            ))}
                        </div>
                    </div>
                )}

                {/* All Tastings */}
                <div>
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--text-muted)] flex items-center gap-2">
                            <FileText size={12} className="text-orange-500" />
                            {highlightedSummaries.length > 0 ? 'All Tastings' : 'Shared Tastings'}
                        </h2>
                        {summaries.length > 3 && (
                            <div className="relative">
                                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="pl-7 pr-3 py-1 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-full text-[10px] focus:outline-none focus:border-orange-500 transition-colors w-32 md:w-40"
                                />
                            </div>
                        )}
                    </div>

                    {regularSummaries.length > 0 ? (
                        <div className="space-y-2">
                            {regularSummaries.map((s) => (
                                <SummaryCard key={s.id} s={s} />
                            ))}
                        </div>
                    ) : highlightedSummaries.length === 0 ? (
                        <div className="text-center py-12 text-[var(--text-muted)] text-sm">
                            No shared tastings yet.
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Minimal Footer */}
            <div className="mt-16 py-6 border-t border-[var(--border-primary)] text-center">
                <div
                    className="inline-flex items-center gap-1.5 opacity-40 hover:opacity-70 transition-opacity cursor-pointer"
                    onClick={() => window.location.href = import.meta.env.VITE_LANDING_URL || 'http://localhost:4321'}
                >
                    <span className="text-xs font-black tracking-tight text-orange-500">FELLOWSIP</span>
                </div>
            </div>
        </div>
    );
}
