'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, Heart, Loader2, ImageOff, Filter, X, LogIn, ShoppingBag, CheckCircle
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';

// --- TYPES ---
interface Product {
  id: string;
  name: string;
  category: string;
  hair_type: string[] | null;
  hair_concern: string[] | null;
  price: number;
  image_url: string | null;
  images?: string[]; 
  stock: number;
  status: string;
}

// --- TOAST COMPONENT ---
const Toast = ({ 
  show, 
  onClose, 
  product, 
  type 
}: { 
  show: boolean; 
  onClose: () => void; 
  product: Product | null;
  type: 'cart' | 'wishlist' | 'error';
}) => {
  if (!show || !product) return null;

  const validImage = product.image_url || (product.images && product.images[0]) || null;

  return (
    <div className="fixed top-24 right-6 z-[100] animate-in slide-in-from-top-5 fade-in duration-300">
      <div className="bg-white border border-gray-100 shadow-2xl rounded-lg p-4 flex gap-4 items-center max-w-sm w-full pr-10 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-300 hover:text-black">
          <X size={14} />
        </button>
        
        <div className="w-12 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
          {validImage ? (
            <img src={validImage} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageOff size={12} /></div>
          )}
        </div>

        <div>
          <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1 ${type === 'cart' ? 'text-green-600' : 'text-red-500'}`}>
             {type === 'cart' ? (
               <><CheckCircle size={14} /> Added to Bag</>
             ) : (
               <><Heart size={14} fill="currentColor" /> Added to Wishlist</>
             )}
          </h4>
          <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</p>
          
          {type === 'cart' && (
             <Link href="/cart" className="text-[10px] font-bold underline mt-1 block hover:text-gray-600">
               VIEW CART
             </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// --- SHOP CONTENT COMPONENT (uses useSearchParams) ---
function ShopContent() {
  const supabase = supabaseClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState<{ show: boolean; product: Product | null; type: 'cart' | 'wishlist' | 'error' }>({
    show: false, product: null, type: 'cart'
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedConcern, setSelectedConcern] = useState('All'); 
  const [maxPrice, setMaxPrice] = useState(100000);
  const [sortOrder, setSortOrder] = useState('default');

  // --- URL FILTER LOGIC ---
  useEffect(() => {
    const concernFromUrl = searchParams.get('concern');
    if (concernFromUrl) {
      const mapping: Record<string, string> = {
        'hair-fall': 'Hair Fall Control',
        'anti-dandruff': 'Anti-Dandruff',
        'frizz-dryness': 'Frizz Control',
        'scalp-detox': 'Scalp Therapy',
        'damage-repair': 'Damage Repair',
        'shine-glow': 'Shine & Glow',
        'deep-hydration': 'Deep Hydration'
      };
      if (mapping[concernFromUrl]) setSelectedConcern(mapping[concernFromUrl]);
    }
  }, [searchParams]);

  // --- FETCH PRODUCTS ---
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      const { data: productData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (productData) setProducts(productData);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: wishlistData } = await supabase.from('wishlist_items').select('product_id').eq('user_id', user.id);
          if (wishlistData) setWishlistIds(new Set(wishlistData.map((item: { product_id: string }) => item.product_id)));      }
      setLoading(false);
    };
    initData();
  }, []);

  // --- ACTIONS ---
  const checkLogin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoginModalOpen(true); return null; }
    return user;
  };

  const addToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault(); e.stopPropagation();
    const user = await checkLogin();
    if (!user) return;
    setActionLoading(product.id);
    try {
      const { data: existingItem } = await supabase.from('cart_items').select('id, quantity').eq('user_id', user.id).eq('product_id', product.id).single();
      if (existingItem) await supabase.from('cart_items').update({ quantity: existingItem.quantity + 1 }).eq('id', existingItem.id);
      else await supabase.from('cart_items').insert([{ user_id: user.id, product_id: product.id, quantity: 1 }]);
      setToast({ show: true, product, type: 'cart' });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    } catch (error) { console.error(error); } finally { setActionLoading(null); }
  };

  const toggleWishlist = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault(); e.stopPropagation();
    const user = await checkLogin();
    if (!user) return;
    const isLiked = wishlistIds.has(product.id);
    const nextWishlist = new Set(wishlistIds);
    if (isLiked) nextWishlist.delete(product.id); else nextWishlist.add(product.id);
    setWishlistIds(nextWishlist);
    if (isLiked) await supabase.from('wishlist_items').delete().eq('user_id', user.id).eq('product_id', product.id);
    else {
      const { error } = await supabase.from('wishlist_items').insert([{ user_id: user.id, product_id: product.id }]);
      if (!error) {
        setToast({ show: true, product, type: 'wishlist' });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
      }
    }
  };

  // --- FILTER LOGIC ---
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesConcern = selectedConcern === 'All' || (p.hair_concern && p.hair_concern.some((c: string) => c.toLowerCase() === selectedConcern.toLowerCase()));
      const matchesPrice = p.price <= maxPrice;
      return matchesSearch && matchesCategory && matchesConcern && matchesPrice;
    });
    if (sortOrder === 'low-to-high') result.sort((a, b) => a.price - b.price);
    if (sortOrder === 'high-to-low') result.sort((a, b) => b.price - a.price);
    return result;
  }, [searchTerm, selectedCategory, selectedConcern, maxPrice, sortOrder, products]);

  const categories = ['All', 'Hair Oil', 'Shampoo', 'Conditioner', 'Hair Mask'];
  const concerns = ['All', 'Hair Fall Control', 'Anti-Dandruff', 'Scalp Therapy', 'Damage Repair', 'Frizz Control', 'Shine & Glow', 'Deep Hydration'];

  const FilterContent = () => (
    <div className="space-y-8 pr-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Search</h3>
        <div className="relative">
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-200 p-3 pl-9 text-xs focus:outline-none focus:border-black transition-colors" />
          <Search className="absolute left-3 top-3 text-gray-400" size={14} />
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Product Type</h3>
        <div className="space-y-2">
          {categories.map(cat => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-3 h-3 border flex items-center justify-center transition-colors ${selectedCategory === cat ? 'border-black bg-black' : 'border-gray-300 group-hover:border-gray-500'}`}>{selectedCategory === cat && <div className="w-1 h-1 bg-white rounded-full" />}</div>
              <input type="radio" name="category" className="hidden" checked={selectedCategory === cat} onChange={() => setSelectedCategory(cat)} />
              <span className={`text-xs uppercase tracking-wider ${selectedCategory === cat ? 'text-black font-bold' : 'text-gray-500 group-hover:text-black transition-colors'}`}>{cat}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Shop By Concern</h3>
        <div className="space-y-2">
          {concerns.map(type => (
            <label key={type} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-3 h-3 border flex items-center justify-center transition-colors ${selectedConcern === type ? 'border-black bg-black' : 'border-gray-300 group-hover:border-gray-500'}`}>{selectedConcern === type && <div className="w-1 h-1 bg-white rounded-full" />}</div>
              <input type="radio" name="concern" className="hidden" checked={selectedConcern === type} onChange={() => setSelectedConcern(type)} />
              <span className={`text-xs uppercase tracking-wider ${selectedConcern === type ? 'text-black font-bold' : 'text-gray-500 group-hover:text-black transition-colors'}`}>{type}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Price</h3>
        <input type="range" min="0" max="100000" step="100" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full h-0.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
        <div className="flex justify-between text-[10px] text-gray-500 mt-3 font-medium tracking-wide"><span>₹0</span><span>₹{maxPrice}+</span></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 relative">
      <Toast show={toast.show} onClose={() => setToast(prev => ({...prev, show: false}))} product={toast.product} type={toast.type} />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-3xl font-light tracking-wider mb-3">Shop All</h1>
          <p className="text-gray-400 text-[10px] tracking-[0.2em] uppercase">Ayurvedic & Natural Care</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        
        {/* Mobile Toolbar */}
        <div className="md:hidden flex justify-between items-center mb-8 sticky top-0 bg-white z-20 py-4 border-b">
          <button onClick={() => setIsMobileFilterOpen(true)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-gray-200 px-4 py-3 hover:bg-black hover:text-white transition-colors">
            <Filter size={12} /> Filter
          </button>
          <span className="text-[10px] text-gray-500 tracking-wide">{filteredProducts.length} Items</span>
        </div>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-20">
          <aside className="hidden md:block w-56 flex-shrink-0 sticky top-24 h-fit"><FilterContent /></aside>

          <div className="flex-1">
            {/* Desktop Sort */}
            <div className="hidden md:flex justify-between items-end mb-10 pb-4 border-b border-gray-100">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest">{filteredProducts.length} Results</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-widest text-gray-400">Sort:</span>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="text-[10px] font-bold uppercase tracking-widest border-none bg-transparent focus:ring-0 cursor-pointer text-right pr-0">
                  <option value="default">Newest</option>
                  <option value="low-to-high">Price: Low to High</option>
                  <option value="high-to-low">Price: High to Low</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-32"><Loader2 className="animate-spin text-gray-200" size={24} /></div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-32">
                <p className="text-gray-400 text-sm font-light mb-6">No products found matching your criteria.</p>
                <button onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setSelectedConcern('All'); setMaxPrice(100000); }} className="text-[10px] font-bold uppercase border-b border-black pb-1 hover:opacity-50 tracking-widest">Clear Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-16">
                {filteredProducts.map((product) => {
                  const validImage = product.image_url || (product.images && product.images.length > 0 ? product.images[0] : null);
                  const isWishlisted = wishlistIds.has(product.id);

                  return (
                    <div key={product.id} className="group relative mx-auto w-full max-w-[380px]">
                      <div className="relative w-full h-[280px] md:h-[450px] overflow-hidden bg-gray-100 mb-4 md:mb-6 border border-transparent cursor-pointer" onClick={() => router.push(`/product/${product.id}`)}>
                        {validImage ? (
                          <img src={validImage} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-100"><ImageOff size={24} /><span className="text-[10px] mt-2">No Image</span></div>
                        )}
                        
                        {product.stock <= 0 && <span className="absolute top-4 left-4 bg-white/90 backdrop-blur text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 text-gray-500 z-10">Sold Out</span>}

                        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-10">
                          <button onClick={(e) => addToCart(e, product)} disabled={actionLoading === product.id || product.stock <= 0} className="w-full bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] py-3.5 hover:bg-black hover:text-white transition-colors shadow-xl flex items-center justify-center gap-2">
                            {actionLoading === product.id ? <Loader2 className="animate-spin" size={12} /> : <>Add to Cart <ShoppingBag size={12} /></>}
                          </button>
                        </div>
                        <button onClick={(e) => toggleWishlist(e, product)} className={`absolute top-4 right-4 transition-all duration-300 z-10 p-2 rounded-full ${isWishlisted ? 'text-red-500 opacity-100 scale-110' : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:text-black hover:scale-110'}`}>
                          <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
                        </button>
                      </div>

                      <div className="text-center space-y-1.5 px-2">
                        <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em]">{product.category}</p>
                        <Link href={`/product/${product.id}`}><h3 className="text-xs md:text-sm font-medium text-gray-900 tracking-wide cursor-pointer line-clamp-1">{product.name}</h3></Link>
                        <p className="text-[11px] font-semibold text-gray-900 mt-1">₹{product.price.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileFilterOpen(false)}></div>
          <div className="absolute right-0 top-0 h-full w-[280px] bg-white p-8 shadow-2xl overflow-y-auto">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em]">Filters</h2>
              <button onClick={() => setIsMobileFilterOpen(false)}><X size={18} className="text-gray-400 hover:text-black" /></button>
            </div>
            <FilterContent />
            <div className="mt-10 pt-6 border-t border-gray-100">
              <button onClick={() => setIsMobileFilterOpen(false)} className="w-full bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] py-4">Show Results</button>
            </div>
          </div>
        </div>
      )}

      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsLoginModalOpen(false)}></div>
          <div className="bg-white p-10 max-w-sm w-full relative z-10 text-center shadow-2xl">
            <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-4 right-4 text-gray-300 hover:text-black"><X size={18} /></button>
            <div className="mb-6 flex justify-center text-gray-900"><LogIn size={28} strokeWidth={1} /></div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-3">Sign In Required</h3>
            <p className="text-[11px] text-gray-500 mb-8 leading-relaxed tracking-wide">Please sign in to manage your cart and wishlist.</p>
            <div className="space-y-3">
              <Link href="/login" className="block w-full bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] py-3.5 hover:bg-gray-800 transition-colors">Sign In</Link>
              <button onClick={() => setIsLoginModalOpen(false)} className="block w-full bg-transparent text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] py-3.5 hover:text-black transition-colors">Continue Shopping</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- MAIN EXPORT (with Suspense wrapper) ---
export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}