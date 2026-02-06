'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, Heart, Loader2, ImageOff, Filter, X, LogIn, ShoppingBag, CheckCircle, 
  ChevronDown, Minus, Plus
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

// --- CONSTANTS ---
const CATEGORIES = ['Hair Oil', 'Shampoo', 'Conditioner', 'Hair Mask', 'Serums'];
const CONCERNS = ['Hair Fall Control', 'Anti-Dandruff', 'Scalp Therapy', 'Damage Repair', 'Frizz Control', 'Shine & Glow', 'Deep Hydration'];
const HAIR_TYPES = ['Straight', 'Wavy', 'Curly', 'Coily', 'Fine', 'Thick'];

// --- 1. TOAST NOTIFICATION ---
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

// --- 2. COLLAPSIBLE SECTION ---
const FilterSection = ({ 
  title, 
  children, 
  isOpenDefault = true 
}: { 
  title: string; 
  children: React.ReactNode; 
  isOpenDefault?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);

  return (
    <div className="border-b border-gray-100 py-6 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center justify-between w-full group mb-4"
      >
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 group-hover:text-black">{title}</h3>
        {isOpen ? <Minus size={14} className="text-gray-400" /> : <Plus size={14} className="text-gray-400" />}
      </button>
      
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {children}
      </div>
    </div>
  );
};

// --- 3. FILTER PANEL (MOVED OUTSIDE TO FIX SCROLL BUG) ---
interface FilterPanelProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  inStockOnly: boolean;
  setInStockOnly: (v: boolean) => void;
  selectedCategories: string[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  selectedConcerns: string[];
  setSelectedConcerns: React.Dispatch<React.SetStateAction<string[]>>;
  selectedHairTypes: string[];
  setSelectedHairTypes: React.Dispatch<React.SetStateAction<string[]>>;
  priceRange: { min: number | ''; max: number | '' };
  setPriceRange: React.Dispatch<React.SetStateAction<{ min: number | ''; max: number | '' }>>;
  clearFilters: () => void;
}

const FilterPanel = ({
  searchTerm, setSearchTerm,
  inStockOnly, setInStockOnly,
  selectedCategories, setSelectedCategories,
  selectedConcerns, setSelectedConcerns,
  selectedHairTypes, setSelectedHairTypes,
  priceRange, setPriceRange,
  clearFilters
}: FilterPanelProps) => {
  
  const toggleSelection = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <div className="space-y-2 pr-2">
      {/* SEARCH */}
      <div className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Search</h3>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-white border border-gray-200 p-3 pl-9 text-xs focus:outline-none focus:border-black transition-colors rounded-sm" 
          />
          <Search className="absolute left-3 top-3 text-gray-400" size={14} />
        </div>
      </div>

      {/* AVAILABILITY */}
      <div className="pb-6 border-b border-gray-100">
         <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-4 h-4 border flex items-center justify-center transition-colors rounded-sm ${inStockOnly ? 'border-black bg-black text-white' : 'border-gray-300'}`}>
              {inStockOnly && <CheckCircle size={10} />}
            </div>
            <input type="checkbox" className="hidden" checked={inStockOnly} onChange={() => setInStockOnly(!inStockOnly)} />
            <span className="text-xs text-gray-700 uppercase tracking-wide group-hover:text-black">Exclude Out of Stock</span>
         </label>
      </div>

      {/* CATEGORIES */}
      <FilterSection title="Category">
        <div className="space-y-3">
          {CATEGORIES.map(cat => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-4 h-4 border flex items-center justify-center transition-colors rounded-sm ${selectedCategories.includes(cat) ? 'border-black bg-black text-white' : 'border-gray-300'}`}>
                {selectedCategories.includes(cat) && <CheckCircle size={10} />}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={selectedCategories.includes(cat)} 
                onChange={() => toggleSelection(cat, selectedCategories, setSelectedCategories)} 
              />
              <span className={`text-xs uppercase tracking-wider ${selectedCategories.includes(cat) ? 'text-black font-bold' : 'text-gray-500 group-hover:text-black'}`}>{cat}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* CONCERNS */}
      <FilterSection title="Hair Concern">
        <div className="space-y-3">
          {CONCERNS.map(concern => (
            <label key={concern} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-4 h-4 border flex items-center justify-center transition-colors rounded-sm ${selectedConcerns.includes(concern) ? 'border-black bg-black text-white' : 'border-gray-300'}`}>
                {selectedConcerns.includes(concern) && <CheckCircle size={10} />}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={selectedConcerns.includes(concern)} 
                onChange={() => toggleSelection(concern, selectedConcerns, setSelectedConcerns)} 
              />
              <span className={`text-xs uppercase tracking-wider ${selectedConcerns.includes(concern) ? 'text-black font-bold' : 'text-gray-500 group-hover:text-black'}`}>{concern}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* HAIR TYPE */}
      <FilterSection title="Hair Type" isOpenDefault={false}>
        <div className="space-y-3">
          {HAIR_TYPES.map(type => (
            <label key={type} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-4 h-4 border flex items-center justify-center transition-colors rounded-sm ${selectedHairTypes.includes(type) ? 'border-black bg-black text-white' : 'border-gray-300'}`}>
                {selectedHairTypes.includes(type) && <CheckCircle size={10} />}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={selectedHairTypes.includes(type)} 
                onChange={() => toggleSelection(type, selectedHairTypes, setSelectedHairTypes)} 
              />
              <span className={`text-xs uppercase tracking-wider ${selectedHairTypes.includes(type) ? 'text-black font-bold' : 'text-gray-500 group-hover:text-black'}`}>{type}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* PRICE RANGE (MIN - MAX) */}
      <FilterSection title="Price Range">
         <div className="flex items-center gap-3">
            <div className="relative flex-1">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">₹</span>
               <input 
                 type="number" 
                 placeholder="Min" 
                 value={priceRange.min}
                 onChange={(e) => setPriceRange({...priceRange, min: e.target.value ? Number(e.target.value) : ''})}
                 className="w-full bg-gray-50 border border-gray-200 p-2 pl-6 text-xs rounded-sm focus:outline-none focus:border-black"
               />
            </div>
            <span className="text-gray-400">-</span>
            <div className="relative flex-1">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">₹</span>
               <input 
                 type="number" 
                 placeholder="Max" 
                 value={priceRange.max}
                 onChange={(e) => setPriceRange({...priceRange, max: e.target.value ? Number(e.target.value) : ''})}
                 className="w-full bg-gray-50 border border-gray-200 p-2 pl-6 text-xs rounded-sm focus:outline-none focus:border-black"
               />
            </div>
         </div>
         {/* Predefined Ranges */}
         <div className="mt-4 space-y-2">
            <button onClick={() => setPriceRange({min: 0, max: 500})} className="text-[10px] text-gray-500 underline hover:text-black block">Under ₹500</button>
            <button onClick={() => setPriceRange({min: 500, max: 1000})} className="text-[10px] text-gray-500 underline hover:text-black block">₹500 - ₹1000</button>
            <button onClick={() => setPriceRange({min: 1000, max: 2000})} className="text-[10px] text-gray-500 underline hover:text-black block">₹1000 - ₹2000</button>
         </div>
      </FilterSection>

      {/* CLEAR FILTERS */}
      <button 
        onClick={clearFilters} 
        className="w-full mt-8 py-3 text-xs font-bold uppercase tracking-widest border border-black hover:bg-black hover:text-white transition-all"
      >
        Reset Filters
      </button>
    </div>
  );
};

// --- 4. MAIN COMPONENT ---
function ShopContent() {
  const supabase = supabaseClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // --- DATA STATES ---
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // --- UI STATES ---
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; product: Product | null; type: 'cart' | 'wishlist' | 'error' }>({
    show: false, product: null, type: 'cart'
  });

  // --- FILTER STATES ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]); 
  const [selectedHairTypes, setSelectedHairTypes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{min: number | ''; max: number | ''}>({ min: '', max: '' });
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState('default');

  // --- INITIAL LOAD ---
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      const { data: productData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (productData) setProducts(productData);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: wishlistData } = await supabase.from('wishlist_items').select('product_id').eq('user_id', user.id);
        if (wishlistData) setWishlistIds(new Set(wishlistData.map((item: { product_id: string }) => item.product_id)));      
      }
      setLoading(false);
    };
    initData();
  }, [searchParams]);

  // --- FILTER LOGIC ---
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedConcerns([]);
    setSelectedHairTypes([]);
    setPriceRange({ min: '', max: '' });
    setInStockOnly(false);
  };

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category);
      const matchesConcern = selectedConcerns.length === 0 || (
        p.hair_concern && p.hair_concern.some(c => selectedConcerns.includes(c))
      );
      const matchesHairType = selectedHairTypes.length === 0 || (
        p.hair_type && p.hair_type.some(t => selectedHairTypes.includes(t))
      );
      const min = typeof priceRange.min === 'number' ? priceRange.min : 0;
      const max = typeof priceRange.max === 'number' ? priceRange.max : 1000000;
      const matchesPrice = p.price >= min && p.price <= max;
      const matchesStock = !inStockOnly || p.stock > 0;

      return matchesSearch && matchesCategory && matchesConcern && matchesHairType && matchesPrice && matchesStock;
    });

    if (sortOrder === 'low-to-high') result.sort((a, b) => a.price - b.price);
    if (sortOrder === 'high-to-low') result.sort((a, b) => b.price - a.price);

    return result;
  }, [searchTerm, selectedCategories, selectedConcerns, selectedHairTypes, priceRange, inStockOnly, sortOrder, products]);

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

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 relative overflow-x-hidden">
      <Toast show={toast.show} onClose={() => setToast(prev => ({...prev, show: false}))} product={toast.product} type={toast.type} />
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-3xl font-light tracking-wider mb-3">Shop All</h1>
          <p className="text-gray-400 text-[10px] tracking-[0.2em] uppercase">Ayurvedic & Natural Care</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        
        {/* MOBILE TOOLBAR */}
        <div className="md:hidden flex justify-between items-center mb-8 sticky top-0 bg-white z-20 py-4 border-b">
          <button onClick={() => setIsMobileFilterOpen(true)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-gray-200 px-4 py-3 hover:bg-black hover:text-white transition-colors">
            <Filter size={12} /> Filter
          </button>
          <span className="text-[10px] text-gray-500 tracking-wide">{filteredProducts.length} Items</span>
        </div>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
          
          {/* DESKTOP SIDEBAR */}
          <aside className="hidden md:block w-64 flex-shrink-0 sticky top-24 h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar">
             <FilterPanel 
               searchTerm={searchTerm} setSearchTerm={setSearchTerm}
               inStockOnly={inStockOnly} setInStockOnly={setInStockOnly}
               selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories}
               selectedConcerns={selectedConcerns} setSelectedConcerns={setSelectedConcerns}
               selectedHairTypes={selectedHairTypes} setSelectedHairTypes={setSelectedHairTypes}
               priceRange={priceRange} setPriceRange={setPriceRange}
               clearFilters={clearFilters}
             />
          </aside>

          {/* PRODUCT GRID */}
          <div className="flex-1">
            <div className="hidden md:flex justify-between items-end mb-10 pb-4 border-b border-gray-100">
              <div className="flex gap-4 items-center">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest">{filteredProducts.length} Results</span>
                  {(selectedCategories.length > 0 || selectedConcerns.length > 0 || priceRange.min !== '' || priceRange.max !== '') && (
                     <span className="text-[10px] text-black font-bold cursor-pointer hover:underline" onClick={clearFilters}>
                        Clear All X
                     </span>
                  )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-widest text-gray-400">Sort:</span>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="text-[10px] font-bold uppercase tracking-widest border-none bg-transparent focus:ring-0 cursor-pointer text-right pr-0 outline-none">
                  <option value="default">Newest</option>
                  <option value="low-to-high">Price: Low to High</option>
                  <option value="high-to-low">Price: High to Low</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-32"><Loader2 className="animate-spin text-gray-200" size={24} /></div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-32 bg-gray-50 rounded-lg">
                <p className="text-gray-400 text-sm font-light mb-6">No products found matching your criteria.</p>
                <button onClick={clearFilters} className="text-[10px] font-bold uppercase border-b border-black pb-1 hover:opacity-50 tracking-widest">Clear All Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
                {filteredProducts.map((product) => {
                  const validImage = product.image_url || (product.images && product.images.length > 0 ? product.images[0] : null);
                  const isWishlisted = wishlistIds.has(product.id);

                  return (
                    <div key={product.id} className="group relative mx-auto w-full">
                      {/* IMAGE */}
                      <div 
                        className="relative w-full aspect-[3/4] overflow-hidden bg-gray-100 mb-4 border border-transparent cursor-pointer rounded-sm" 
                        onClick={() => router.push(`/product/${product.id}`)}
                      >
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

                      {/* DETAILS */}
                      <div className="text-left space-y-1.5 px-1">
                        <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em]">{product.category}</p>
                        <Link href={`/product/${product.id}`}><h3 className="text-sm font-medium text-gray-900 tracking-wide cursor-pointer line-clamp-1 group-hover:underline decoration-1 underline-offset-4">{product.name}</h3></Link>
                        <p className="text-xs font-semibold text-gray-900 mt-1">₹{product.price.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileFilterOpen(false)}></div>
          <div className="absolute right-0 top-0 h-full w-[300px] bg-white p-6 shadow-2xl overflow-y-auto">
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em]">Filter & Sort</h2>
              <button onClick={() => setIsMobileFilterOpen(false)}><X size={18} className="text-gray-400 hover:text-black" /></button>
            </div>
            
            <FilterPanel 
               searchTerm={searchTerm} setSearchTerm={setSearchTerm}
               inStockOnly={inStockOnly} setInStockOnly={setInStockOnly}
               selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories}
               selectedConcerns={selectedConcerns} setSelectedConcerns={setSelectedConcerns}
               selectedHairTypes={selectedHairTypes} setSelectedHairTypes={setSelectedHairTypes}
               priceRange={priceRange} setPriceRange={setPriceRange}
               clearFilters={clearFilters}
             />
            
            <div className="mt-8 pt-6 border-t border-gray-100 sticky bottom-0 bg-white pb-4">
              <button onClick={() => setIsMobileFilterOpen(false)} className="w-full bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] py-4">
                View {filteredProducts.length} Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsLoginModalOpen(false)}></div>
          <div className="bg-white p-10 max-w-sm w-full relative z-10 text-center shadow-2xl rounded-sm">
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

// --- EXPORT ---
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