import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, ChevronRight, ArrowUpDown, Package, Archive } from 'lucide-react';
import { useAllSummaries, useArchiveSession } from '../api/sessions';
import { getProductIcon, getProductColor } from '../utils/productIcons';

type SortOption = 'name' | 'date' | 'rating';

export function Dashboard() {
  const navigate = useNavigate();
  const { data: summariesData, isLoading } = useAllSummaries();
  const archiveSession = useArchiveSession();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  const summaries = summariesData?.summaries || [];

  const filteredAndSortedSummaries = useMemo(() => {
    let filtered = summaries.filter(s =>
      s.session.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort based on selected option
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.session.name || '').localeCompare(b.session.name || '');
        case 'date':
          return new Date(b.session.startedAt).getTime() - new Date(a.session.startedAt).getTime();
        case 'rating':
          return (b.summary?.metadata?.rating || 0) - (a.summary?.metadata?.rating || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [summaries, searchQuery, sortBy]);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-xl">My Cellar</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Your tasting journal • {summaries.length} entries</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search tastings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[var(--bg-input)] border-[var(--border-primary)] text-sm w-64"
            />
          </div>
          <div className="relative">
            <ArrowUpDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="pl-10 pr-8 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] text-sm appearance-none cursor-pointer"
            >
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
              <option value="rating">Sort by Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasting Journal Grid */}
      {filteredAndSortedSummaries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedSummaries.map((item) => {
            const ProductIcon = getProductIcon(item.session.productType);
            const colorClass = getProductColor(item.session.productType);
            return (
              <div
                key={item.session.id}
                onClick={() => navigate(`/session/${item.session.id}/summary`)}
                className="card hover:border-gray-600 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-[var(--bg-input)] rounded-lg flex items-center justify-center ${colorClass}`}>
                      <ProductIcon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)] group-hover:text-white transition-colors">
                        {item.session.productName || item.session.name}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {item.session.productName ? item.session.name : (item.session.productType || 'Tasting')}
                      </p>
                    </div>
                  </div>
                  {item.summary?.metadata?.rating && (
                    <div className="flex flex-col items-end">
                      <span className="text-xl font-bold text-orange-500">{item.summary.metadata.rating}</span>
                      <span className="text-[8px] text-[var(--text-muted)] uppercase font-bold tracking-tighter">Score</span>
                    </div>
                  )}
                </div>

                {/* Tasting Profile Quick View */}
                <div className="space-y-2 mb-4">
                  {item.summary?.nose && (
                    <div className="flex gap-2">
                      <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold w-12">Nose</span>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-1 flex-1">{item.summary.nose}</p>
                    </div>
                  )}
                  {item.summary?.palate && (
                    <div className="flex gap-2">
                      <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold w-12">Palate</span>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-1 flex-1">{item.summary.palate}</p>
                    </div>
                  )}
                  {item.summary?.finish && (
                    <div className="flex gap-2">
                      <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold w-12">Finish</span>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-1 flex-1">{item.summary.finish}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--border-primary)]">
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                    <Calendar size={12} />
                    <span>{item.session?.startedAt ? new Date(item.session.startedAt).toLocaleDateString() : ''}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveSession.mutate(item.session.id);
                      }}
                      className="text-[10px] text-[var(--text-secondary)] hover:text-orange-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Archive this tasting"
                    >
                      <Archive size={12} />
                      Archive
                    </button>
                    <div className="flex items-center gap-1 text-[10px] text-orange-500 font-bold group-hover:underline">
                      View Details <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-[var(--bg-main)]/30 rounded-lg border border-dashed border-[var(--border-primary)]">
          <Package size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
          <h3 className="text-lg font-bold text-[var(--text-secondary)] mb-2">Your Cellar is Empty</h3>
          <p className="text-[var(--text-secondary)] text-sm mb-6">Start a tasting session to add entries to your journal.</p>
          <button
            onClick={() => navigate('/create')}
            className="btn-orange"
          >
            Start First Tasting
          </button>
        </div>
      )}
    </div>
  );
}
