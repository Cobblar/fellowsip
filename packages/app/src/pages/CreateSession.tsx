import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wine, Coffee, Beer, Grape, Leaf, Square, ChevronRight, Plus, Loader2, ChevronLeft } from 'lucide-react';
import { useCreateSession } from '../api/sessions';
import { api } from '../api/client';

const PRODUCT_TYPES = [
  { name: 'Wine', icon: Grape },
  { name: 'Whisky', icon: Wine },
  { name: 'Beer', icon: Beer },
  { name: 'Sake', icon: Wine },
  { name: 'Coffee', icon: Coffee },
  { name: 'Tea', icon: Leaf },
  { name: 'Chocolate', icon: Square },
  { name: 'Other', icon: Wine },
];

export function CreateSession() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [productType, setProductType] = useState('');
  const [productLink, setProductLink] = useState('');
  const [productName, setProductName] = useState('');
  const [livestreamUrl, setLivestreamUrl] = useState('');
  const [showProductLink, setShowProductLink] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const createSession = useCreateSession();

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!productLink || !productLink.startsWith('http')) return;

      setIsFetchingMetadata(true);
      try {
        const res = await api.get<{ title: string }>(`/sessions/metadata?url=${encodeURIComponent(productLink)}`);
        if (res.title && !productName) {
          // Clean up common title suffixes
          const cleanTitle = res.title
            .split(' | ')[0]
            .split(' - ')[0]
            .split(' : ')[0]
            .trim();
          setProductName(cleanTitle);
        }
      } catch (err) {
        console.error('Failed to fetch metadata:', err);
      } finally {
        setIsFetchingMetadata(false);
      }
    };

    const timer = setTimeout(fetchMetadata, 1000);
    return () => clearTimeout(timer);
  }, [productLink]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const result = await createSession.mutateAsync({
        name: name.trim(),
        productType: productType || undefined,
        productLink: productLink.trim() || undefined,
        productName: productName.trim() || undefined,
        livestreamUrl: livestreamUrl.trim() || undefined,
      });
      navigate(`/session/${result.session.id}`);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8 flex items-start gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-white md:hidden flex-shrink-0"
          title="Go Back"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="heading-xl mb-2">Create New Session</h1>
          <p className="text-sm text-[var(--text-secondary)]">Set up a collaborative tasting experience for your group.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="card">
          <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4 block">Session Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., 2018 Pu-erh Vertical Tasting"
            className="w-full bg-[var(--bg-main)] border-[var(--border-primary)] text-base py-3"
            required
          />
        </div>

        <div className="card">
          <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4 block">What are you tasting?</label>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 block">Product Name (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., 2018 Dayi 7542 Raw Pu-erh"
                  className="w-full bg-[var(--bg-main)] border-[var(--border-primary)] text-sm py-2.5 pr-10"
                />
                {isFetchingMetadata && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={14} className="text-orange-500 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 block">Product Category</label>
              <div className="grid grid-cols-4 gap-3">
                {PRODUCT_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = productType === type.name;
                  return (
                    <button
                      key={type.name}
                      type="button"
                      onClick={() => setProductType(isSelected ? '' : type.name)}
                      className={`flex flex-col items-center gap-2.5 p-3 rounded-lg border transition-all ${isSelected
                        ? 'bg-orange-500/10 border-orange-500 text-orange-500'
                        : 'bg-[var(--bg-main)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                        }`}
                    >
                      <Icon size={20} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{type.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowProductLink(!showProductLink)}
                className="text-[10px] font-bold uppercase tracking-widest text-orange-500 hover:text-orange-400 flex items-center gap-1.5 transition-colors"
              >
                <Plus size={12} className={`transition-transform ${showProductLink ? 'rotate-45' : ''}`} />
                {showProductLink ? 'Hide Product Link' : 'Add Product Link'}
              </button>

              {showProductLink && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 block">Product Link (Optional)</label>
                  <input
                    type="url"
                    value={productLink}
                    onChange={(e) => setProductLink(e.target.value)}
                    placeholder="https://example.com/product"
                    className="w-full bg-[var(--bg-main)] border-[var(--border-primary)] text-sm py-2"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4 block">Livestream URL (Optional)</label>
          <input
            type="url"
            value={livestreamUrl}
            onChange={(e) => setLivestreamUrl(e.target.value)}
            placeholder="YouTube or Twitch URL"
            className="w-full bg-[var(--bg-main)] border-[var(--border-primary)] text-sm py-3"
          />
          <p className="mt-2 text-[10px] text-[var(--text-muted)]">
            Add a YouTube or Twitch link to embed the stream in your session.
          </p>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createSession.isPending || !name.trim()}
            className="btn-orange"
          >
            {createSession.isPending ? 'Creating...' : 'Start Session'}
            <ChevronRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
