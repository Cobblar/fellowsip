import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2, ChevronLeft, User, Users, Wine, Layers, Plus, X, AlertCircle } from 'lucide-react';
import { useCreateSession } from '../api/sessions';
import { api } from '../api/client';
import { getProductIcon } from '../utils/productIcons';

const PRODUCT_TYPES = ['Wine', 'Whisky', 'Beer', 'Sake', 'Coffee', 'Tea', 'Chocolate', 'Other'];

const SelectionButton = ({
  selected,
  onClick,
  icon: Icon,
  title,
  description,
}: {
  selected: boolean,
  onClick: () => void,
  icon: any,
  title: string,
  description: string,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all text-center ${selected
      ? 'bg-orange-500/10 border-orange-500 text-orange-500 shadow-lg shadow-orange-500/10'
      : 'bg-[var(--bg-card)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
      }`}
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selected ? 'bg-orange-500 text-white' : 'bg-[var(--bg-input)] text-[var(--text-muted)]'}`}>
      <Icon size={24} />
    </div>
    <div>
      <h3 className={`font-bold uppercase tracking-widest text-xs mb-1 ${selected ? 'text-orange-500' : 'text-[var(--text-primary)]'}`}>{title}</h3>
      <p className="text-[10px] opacity-70">{description}</p>
    </div>
  </button>
);

export function CreateSession() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [sessionType, setSessionType] = useState<'solo' | 'group' | null>(null);
  const [productMode, setProductMode] = useState<'single' | 'sidebyside' | null>(null);
  const [products, setProducts] = useState<Array<{
    productType: string;
    productLink: string;
    productName: string;
    productDescription: string;
    isFetchingMetadata: boolean;
  }>>([{ productType: '', productLink: '', productName: '', productDescription: '', isFetchingMetadata: false }]);
  const [livestreamUrl, setLivestreamUrl] = useState('');
  const [showNameError, setShowNameError] = useState(false);
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

  // Handle product mode changes
  useEffect(() => {
    if (productMode === 'single') {
      setProducts(prev => [prev[0] || { productType: '', productLink: '', productName: '', productDescription: '', isFetchingMetadata: false }]);
    } else if (productMode === 'sidebyside') {
      setProducts(prev => {
        if (prev.length >= 2) return prev;
        const newProducts = [...prev];
        while (newProducts.length < 2) {
          newProducts.push({ productType: '', productLink: '', productName: '', productDescription: '', isFetchingMetadata: false });
        }
        return newProducts;
      });
    }
  }, [productMode]);

  const fetchMetadata = async (index: number, link: string) => {
    setProducts(prev => prev.map((p, i) => i === index ? { ...p, isFetchingMetadata: true } : p));
    try {
      const res = await api.get<{ title: string; description: string | null }>(`/sessions/metadata?url=${encodeURIComponent(link)}`);
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
    if (!name.trim()) {
      setShowNameError(true);
      // Scroll to top to show the name field
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!sessionType || !productMode) return;

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
        isSolo: sessionType === 'solo',
      });
      navigate(`/session/${result.session.id}`);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };


  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-12 text-center relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] md:hidden"
          title="Go Back"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="heading-xl mb-2">Create New Session</h1>
        <p className="text-sm text-[var(--text-secondary)]">Set up your tasting experience.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Step 1: Name and Type */}
        <div className="space-y-8">
          <div className="card max-w-2xl mx-auto">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4 block text-center">Session Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (showNameError) setShowNameError(false);
              }}
              placeholder="e.g., 2018 Pu-erh Vertical Tasting"
              className={`w-full bg-[var(--bg-main)] border-[var(--border-primary)] text-base py-3 text-center focus:border-orange-500 transition-colors ${showNameError ? 'border-red-500 ring-1 ring-red-500/50' : ''
                }`}
            />
            {showNameError && (
              <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 text-center flex items-center justify-center gap-1">
                <AlertCircle size={12} />
                Session Name Required
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
            <SelectionButton
              selected={sessionType === 'solo'}
              onClick={() => setSessionType('solo')}
              icon={User}
              title="Solo Tasting"
              description="Just me, taking notes"
            />
            <SelectionButton
              selected={sessionType === 'group'}
              onClick={() => setSessionType('group')}
              icon={Users}
              title="Group Tasting"
              description="Tasting with friends"
            />
          </div>
        </div>

        {/* Step 2: Product Mode */}
        {sessionType && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <SelectionButton
                selected={productMode === 'single'}
                onClick={() => setProductMode('single')}
                icon={Wine}
                title="Single Product"
                description="Focus on one item"
              />
              <SelectionButton
                selected={productMode === 'sidebyside'}
                onClick={() => setProductMode('sidebyside')}
                icon={Layers}
                title="Side by Side"
                description="Compare multiple products"
              />
            </div>
          </div>
        )}

        {/* Step 3: Product Details */}
        {productMode && (
          <div className="space-y-10">
            <div className={`grid gap-6 grid-cols-1 ${productMode === 'sidebyside' ? 'md:grid-cols-2 lg:grid-cols-3' : 'max-w-2xl mx-auto'}`}>
              {products.map((product, index) => (
                <div
                  key={index}
                  className="card relative group h-full"
                >
                  {productMode === 'sidebyside' && products.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-6 block text-center">
                    {productMode === 'sidebyside' ? `Product ${index + 1}` : 'What are you tasting?'}
                  </label>

                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 block text-center">Product Name (Optional)</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={product.productName}
                          onChange={(e) => updateProduct(index, { productName: e.target.value })}
                          placeholder="e.g., 2018 Dayi 7542 Raw Pu-erh"
                          className="w-full bg-[var(--bg-main)] border-[var(--border-primary)] text-sm py-2.5 pr-10 text-center"
                        />
                        {product.isFetchingMetadata && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 size={14} className="text-orange-500 animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 block text-center">Product Category</label>
                      <div className="grid grid-cols-4 gap-2">
                        {PRODUCT_TYPES.map((type) => {
                          const emoji = getProductIcon(type);
                          const isSelected = product.productType === type;
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => updateProduct(index, { productType: isSelected ? '' : type })}
                              className={`flex flex-col items-center gap-2 p-2 rounded-lg border transition-all ${isSelected
                                ? 'bg-orange-500/10 border-orange-500 text-orange-500'
                                : 'bg-[var(--bg-main)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                                }`}
                            >
                              <span className="text-xl">{emoji}</span>
                              <span className="text-[8px] font-bold uppercase tracking-wider text-center">{type}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 block text-center">Product Link (Optional)</label>
                      <input
                        type="url"
                        value={product.productLink}
                        onChange={(e) => updateProduct(index, { productLink: e.target.value })}
                        placeholder="https://example.com/product"
                        className="w-full bg-[var(--bg-main)] border-[var(--border-primary)] text-sm py-2.5 text-center"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {productMode === 'sidebyside' && products.length < 3 && (
                <button
                  type="button"
                  onClick={addProduct}
                  className="w-full min-h-[300px] border-2 border-dashed border-[var(--border-primary)] rounded-2xl text-[var(--text-secondary)] hover:border-orange-500 hover:text-orange-500 transition-all flex flex-col items-center justify-center gap-2 group bg-[var(--bg-card)]/50"
                >
                  <div className="w-12 h-12 rounded-full bg-[var(--bg-input)] flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <Plus size={24} />
                  </div>
                  <span className="font-bold uppercase tracking-widest text-[10px]">Add Product</span>
                </button>
              )}
            </div>

            {sessionType === 'group' && (
              <div className="card max-w-2xl mx-auto">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4 block text-center">Livestream URL (Optional)</label>
                <input
                  type="url"
                  value={livestreamUrl}
                  onChange={(e) => setLivestreamUrl(e.target.value)}
                  placeholder="YouTube or Twitch URL"
                  className="w-full bg-[var(--bg-main)] border-[var(--border-primary)] text-sm py-3 text-center"
                />
                <p className="mt-2 text-[10px] text-[var(--text-muted)] text-center">
                  Add a YouTube or Twitch link to embed the stream in your session.
                </p>
              </div>
            )}

            <div className="flex flex-col items-center gap-4 pt-8">
              {showNameError && (
                <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <AlertCircle size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Session Name Required</span>
                </div>
              )}
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSession.isPending}
                  className="btn-orange min-w-[200px]"
                >
                  {createSession.isPending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Start Session
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
