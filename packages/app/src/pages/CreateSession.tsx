import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2, ChevronLeft } from 'lucide-react';
import { useCreateSession } from '../api/sessions';
import { api } from '../api/client';
import { getProductIcon } from '../utils/productIcons';

const PRODUCT_TYPES = ['Wine', 'Whisky', 'Beer', 'Sake', 'Coffee', 'Tea', 'Chocolate', 'Other'];

export function CreateSession() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [products, setProducts] = useState<Array<{
    productType: string;
    productLink: string;
    productName: string;
    productDescription: string;
    isFetchingMetadata: boolean;
  }>>([{ productType: '', productLink: '', productName: '', productDescription: '', isFetchingMetadata: false }]);
  const [livestreamUrl, setLivestreamUrl] = useState('');
  const [isSoloSession, setIsSoloSession] = useState(false);
  const createSession = useCreateSession();

  useEffect(() => {
    products.forEach((product, index) => {
      if (product.productLink && product.productLink.startsWith('http') && !product.productName && !product.productDescription && !product.isFetchingMetadata) {
        const timer = setTimeout(() => {
          fetchMetadata(index, product.productLink);
        }, 1000);
        return () => clearTimeout(timer);
      }
    });
  }, [products]);

  const fetchMetadata = async (index: number, link: string) => {
    console.log(`[CreateSession] Fetching metadata for: ${link}`);
    setProducts(prev => prev.map((p, i) => i === index ? { ...p, isFetchingMetadata: true } : p));
    try {
      const res = await api.get<{ title: string; description: string | null }>(`/sessions/metadata?url=${encodeURIComponent(link)}`);
      console.log(`[CreateSession] Metadata response:`, res);
      if (res.title) {
        const cleanTitle = res.title.split(' | ')[0].split(' - ')[0].split(' : ')[0].trim();
        setProducts(prev => prev.map((p, i) => (i === index && !p.productName) ? { ...p, productName: cleanTitle } : p));
      }
      if (res.description) {
        setProducts(prev => prev.map((p, i) => (i === index && !p.productDescription) ? { ...p, productDescription: res.description! } : p));
      }
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
    } finally {
      setProducts(prev => prev.map((p, i) => i === index ? { ...p, isFetchingMetadata: false } : p));
    }
  };

  const updateProduct = (index: number, updates: any) => {
    setProducts(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const addProduct = () => {
    if (products.length < 3) {
      setProducts([...products, { productType: '', productLink: '', productName: '', productDescription: '', isFetchingMetadata: false }]);
    }
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const result = await createSession.mutateAsync({
        name: name.trim(),
        products: products.map(p => ({
          productType: p.productType || null,
          productLink: p.productLink.trim() || null,
          productName: p.productName.trim() || null,
          productDescription: p.productDescription.trim() || null,
        })),
        livestreamUrl: livestreamUrl.trim() || undefined,
        isSolo: isSoloSession,
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
          className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] md:hidden flex-shrink-0"
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

        {products.map((product, index) => (
          <div key={index} className="card relative group">
            {products.length > 1 && (
              <button
                type="button"
                onClick={() => removeProduct(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <ChevronLeft size={16} className="rotate-45" />
              </button>
            )}
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4 block">
              {products.length > 1 ? `Product ${index + 1}` : 'What are you tasting?'}
            </label>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 block">Product Name (Optional)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={product.productName}
                    onChange={(e) => updateProduct(index, { productName: e.target.value })}
                    placeholder="e.g., 2018 Dayi 7542 Raw Pu-erh"
                    className="w-full bg-[var(--bg-main)] border-[var(--border-primary)] text-sm py-2.5 pr-10"
                  />
                  {product.isFetchingMetadata && (
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
                    const emoji = getProductIcon(type);
                    const isSelected = product.productType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateProduct(index, { productType: isSelected ? '' : type })}
                        className={`flex flex-col items-center gap-2.5 p-3 rounded-lg border transition-all ${isSelected
                          ? 'bg-orange-500/10 border-orange-500 text-orange-500'
                          : 'bg-[var(--bg-main)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                          }`}
                      >
                        <span className="text-2xl">{emoji}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 block">Product Link (Optional)</label>
                <input
                  type="url"
                  value={product.productLink}
                  onChange={(e) => updateProduct(index, { productLink: e.target.value })}
                  placeholder="https://example.com/product"
                  className="w-full bg-[var(--bg-main)] border-[var(--border-primary)] text-sm py-2.5"
                />
                <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">
                  Paste a link to auto-fill the product name.
                </p>
              </div>
            </div>
          </div>
        ))}

        {products.length < 3 && (
          <button
            type="button"
            onClick={addProduct}
            className="w-full py-4 border-2 border-dashed border-[var(--border-primary)] rounded-xl text-[var(--text-secondary)] hover:border-orange-500 hover:text-orange-500 transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-xs"
          >
            + Add Another Product to Compare
          </button>
        )}

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-1 block">Solo Tasting Mode</label>
              <p className="text-[10px] text-[var(--text-muted)]">
                Streamline the experience for individual note-taking.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSoloSession(!isSoloSession)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isSoloSession ? 'bg-orange-500' : 'bg-[var(--bg-input)] border border-[var(--border-primary)]'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSoloSession ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
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
