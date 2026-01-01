import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, ChevronRight, ArrowUpDown, Package, Archive, SlidersHorizontal } from 'lucide-react';
import { useAllSummaries, useArchiveSession } from '../api/sessions';
import { getProductIcon } from '../utils/productIcons';

type SortOption = 'name' | 'date' | 'rating';

export function Dashboard() {
  const navigate = useNavigate();
  const { data: summariesData, isLoading: summariesLoading } = useAllSummaries();
  const archiveSession = useArchiveSession();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date'); // Default to date for journal
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    nose: '',
    palate: '',
    finish: '',
    observations: '',
    people: ''
  });

  const productTypes = ['Wine', 'Whisky', 'Beer', 'Sake', 'Coffee', 'Tea', 'Chocolate', 'Other'];

  const filteredAndSortedSummaries = useMemo(() => {
    const summaries = summariesData?.summaries || [];

    // Map each summary to include product-specific data
    // Each summary represents one product in a session
    let combined = summaries.map((s: any) => {
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

    // Filter based on selected type
    if (selectedType) {
      combined = combined.filter((item: any) => item.productType === selectedType);
    }

    // Filter based on search query (global)
    let filtered = combined.filter((item: any) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.session.name.toLowerCase().includes(query) ||
          (item.productName && item.productName.toLowerCase().includes(query)) ||
          (item.summary.nose && item.summary.nose.toLowerCase().includes(query)) ||
          (item.summary.palate && item.summary.palate.toLowerCase().includes(query)) ||
          (item.summary.finish && item.summary.finish.toLowerCase().includes(query)) ||
          (item.summary.observations && item.summary.observations.toLowerCase().includes(query))
        );
      }
      return true;
    });

    // Filter based on advanced search
    if (isAdvancedSearch) {
      filtered = filtered.filter((item: any) => {
        const noseMatch = !advancedFilters.nose || (item.summary.nose && item.summary.nose.toLowerCase().includes(advancedFilters.nose.toLowerCase()));
        const palateMatch = !advancedFilters.palate || (item.summary.palate && item.summary.palate.toLowerCase().includes(advancedFilters.palate.toLowerCase()));
        const finishMatch = !advancedFilters.finish || (item.summary.finish && item.summary.finish.toLowerCase().includes(advancedFilters.finish.toLowerCase()));
        const obsMatch = !advancedFilters.observations || (item.summary.observations && item.summary.observations.toLowerCase().includes(advancedFilters.observations.toLowerCase()));

        // People search (requires participants data, which we'll add to the backend)
        const peopleMatch = !advancedFilters.people || (item.summary.participants && item.summary.participants.some((p: any) =>
          (p.displayName && p.displayName.toLowerCase().includes(advancedFilters.people.toLowerCase()))
        ));

        return noseMatch && palateMatch && finishMatch && obsMatch && peopleMatch;
      });
    }

    // Sort based on selected option
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'name':
          return (a.productName || a.session.name || '').localeCompare(b.productName || b.session.name || '');
        case 'date':
          return new Date(b.session.startedAt).getTime() - new Date(a.session.startedAt).getTime();
        case 'rating':
          return (b.summary?.metadata?.rating || 0) - (a.summary?.metadata?.rating || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [summariesData, searchQuery, sortBy, selectedType, isAdvancedSearch, advancedFilters]);

  if (summariesLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="heading-xl">Summaries</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Your tasting journal • {filteredAndSortedSummaries.length} entries</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search tastings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[var(--bg-input)] border-[var(--border-primary)] text-sm w-full sm:w-64"
              />
            </div>
            <button
              onClick={() => setIsAdvancedSearch(!isAdvancedSearch)}
              className={`p-2 rounded border transition-colors ${isAdvancedSearch
                ? 'bg-orange-500/10 border-orange-500 text-orange-500'
                : 'bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              title="Advanced Search"
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>
          <div className="relative flex-1 sm:flex-none">
            <ArrowUpDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="pl-10 pr-8 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] text-sm appearance-none cursor-pointer w-full"
            >
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
              <option value="rating">Sort by Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Advanced Search Panel */}
      {isAdvancedSearch && (
        <div className="bg-[var(--bg-sidebar)] border border-[var(--border-primary)] rounded-xl p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">Advanced Search</h3>
            <button
              onClick={() => {
                setAdvancedFilters({ nose: '', palate: '', finish: '', observations: '', people: '' });
                setIsAdvancedSearch(false);
              }}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Reset & Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Nose</label>
              <input
                type="text"
                placeholder="Search nose notes..."
                value={advancedFilters.nose}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, nose: e.target.value }))}
                className="w-full px-4 py-2 bg-[var(--bg-input)] border-[var(--border-primary)] text-sm rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Palate</label>
              <input
                type="text"
                placeholder="Search palate notes..."
                value={advancedFilters.palate}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, palate: e.target.value }))}
                className="w-full px-4 py-2 bg-[var(--bg-input)] border-[var(--border-primary)] text-sm rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Finish</label>
              <input
                type="text"
                placeholder="Search finish notes..."
                value={advancedFilters.finish}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, finish: e.target.value }))}
                className="w-full px-4 py-2 bg-[var(--bg-input)] border-[var(--border-primary)] text-sm rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Observations</label>
              <input
                type="text"
                placeholder="Search observations..."
                value={advancedFilters.observations}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, observations: e.target.value }))}
                className="w-full px-4 py-2 bg-[var(--bg-input)] border-[var(--border-primary)] text-sm rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">People</label>
              <input
                type="text"
                placeholder="Search participants..."
                value={advancedFilters.people}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, people: e.target.value }))}
                className="w-full px-4 py-2 bg-[var(--bg-input)] border-[var(--border-primary)] text-sm rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setSelectedType(null)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedType === null
            ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20'
            : 'bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
            }`}
        >
          All
        </button>
        {productTypes.map((type) => {
          const emoji = getProductIcon(type);
          const isSelected = selectedType === type;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(isSelected ? null : type)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${isSelected
                ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                }`}
            >
              <span className="text-sm">{emoji}</span>
              {type}
            </button>
          );
        })}
      </div>

      {/* Tasting Journal Grid */}
      {filteredAndSortedSummaries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedSummaries.map((item) => {
            const productEmoji = getProductIcon(item.productType);
            return (
              <div
                key={`${item.session.id}-${item.productIndex}`}
                onClick={() => navigate(`/session/${item.session.id}/summary?product=${item.productIndex}`)}
                className="card hover:border-gray-600 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[var(--bg-input)] rounded-lg flex items-center justify-center text-2xl">
                      {productEmoji}
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--text-primary)] transition-colors">
                        {item.productName || item.session.name}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {item.productName ? item.session.name : (item.productType || 'Tasting')}
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
                <div className="space-y-2 mb-4 min-h-[60px]">
                  {item.summary.nose && (
                    <div className="flex gap-2">
                      <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold w-12">Nose</span>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-1 flex-1">{item.summary.nose}</p>
                    </div>
                  )}
                  {item.summary.palate && (
                    <div className="flex gap-2">
                      <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold w-12">Palate</span>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-1 flex-1">{item.summary.palate}</p>
                    </div>
                  )}
                  {item.summary.finish && (
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
                      className="text-[10px] text-[var(--text-secondary)] hover:text-orange-500 flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
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
      ) : (searchQuery || selectedType || Object.values(advancedFilters).some(v => v !== '')) ? (
        <div className="text-center py-20 bg-[var(--bg-main)]/30 rounded-lg border border-dashed border-[var(--border-primary)]">
          <Search size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
          <h3 className="text-lg font-bold text-[var(--text-secondary)] mb-2">No matches found</h3>
          <p className="text-[var(--text-secondary)] text-sm mb-6">Try adjusting your search or filters to find what you're looking for.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedType(null);
              setAdvancedFilters({ nose: '', palate: '', finish: '', observations: '', people: '' });
            }}
            className="btn-orange"
          >
            Clear all filters
          </button>
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
