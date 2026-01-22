'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit2, Trash2, X, Loader2, 
  UploadCloud, Package, ChevronDown, Check,
  AlertCircle, LayoutGrid, Tag, Home // Added Home Icon
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';

// --- CONSTANTS ---
const HAIR_TYPE_OPTIONS = ['Oily', 'Dry', 'Sensitive', 'Normal'];
const CONCERN_OPTIONS = [
  'Hair Fall Control', 'Anti-Dandruff', 'Scalp Therapy', 
  'Damage Repair', 'Frizz Control',  'Deep Hydration & Shine & Glow'
];

// --- TYPES ---
interface Product {
  id?: string;
  created_at?: string;
  name: string;
  sku: string;
  original_price: number;
  price: number;
  stock: number;
  status: string;
  category: string;
  
  // Classification
  hair_type: string[];      
  hair_concern: string[];   
  benefits: string[];     

  // Descriptions
  short_description: string;
  description: string;      
  ingredients: string;
  how_to_use: string;

  volume_ml: number;
  weight: number;
  images: string[];
  image_url: string | null;
  is_visible: boolean;
  show_on_home?: boolean; // Ensure this is in type
}

const INITIAL_PRODUCT_STATE: Product = {
  name: '', sku: '', original_price: 0, price: 0, stock: 0, 
  status: 'in_stock', category: 'Shampoo', 
  hair_type: [], hair_concern: [], benefits: [],
  short_description: '', description: '', ingredients: '', how_to_use: '',
  volume_ml: 0, weight: 0, images: [], image_url: null, is_visible: true, show_on_home: false
};

// --- MULTI-SELECT COMPONENT ---
function MultiSelectDropdown({ label, options, selectedValues, onChange }: { 
  label: string, 
  options: string[], 
  selectedValues: string[], 
  onChange: (newValues: string[]) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(v => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  const removeValue = (e: React.MouseEvent, value: string) => {
    e.stopPropagation(); 
    onChange(selectedValues.filter(v => v !== value));
  };

  return (
    <div className="relative group" ref={wrapperRef}>
      <label className="input-label mb-1.5">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className={`w-full min-h-[40px] px-3 py-2 bg-[#f8fafc] border rounded-lg cursor-pointer transition-all flex flex-wrap items-center gap-2 ${isOpen ? 'border-black ring-0 bg-white shadow-sm' : 'border-[#e2e8f0] hover:border-slate-300'}`}
      >
        {selectedValues.length === 0 && <span className="text-slate-400 text-[13px] font-semibold">Select options...</span>}
        {selectedValues.map(val => (
          <span key={val} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-black text-white text-[11px] font-bold uppercase tracking-wide">
            {val}
            <button onClick={(e) => removeValue(e, val)} className="text-white/70 hover:text-white transition-colors"><X size={11} strokeWidth={3} /></button>
          </span>
        ))}
        <div className="ml-auto text-slate-400"><ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-black' : ''}`} /></div>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden p-2 animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
            {options.map(option => {
              const isSelected = selectedValues.includes(option);
              return (
                <div key={option} onClick={() => toggleOption(option)} className={`flex items-center justify-between px-3 py-2.5 mb-1 rounded-lg cursor-pointer transition-all text-[13px] font-semibold ${isSelected ? 'bg-slate-50 text-black' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                  <span>{option}</span>
                  {isSelected && <Check size={14} className="text-black" strokeWidth={3} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function ProductsPage() {
  const supabase = supabaseClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [benefitsText, setBenefitsText] = useState('');
  
  const [currentProduct, setCurrentProduct] = useState<Product>(INITIAL_PRODUCT_STATE);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) console.error("Error fetching:", error);
    const safeData = data?.map((p: any) => ({
        ...p,
        hair_type: p.hair_type || [],
        hair_concern: p.hair_concern || []
      , show_on_home: p.show_on_home || false
    }));
    if (safeData) setProducts(safeData as any); 
    setLoading(false);
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
        setCurrentProduct({
            ...product,
            hair_type: Array.isArray(product.hair_type) ? product.hair_type : [],
            hair_concern: Array.isArray(product.hair_concern) ? product.hair_concern : []
        });
        setBenefitsText(product.benefits?.join(', ') || '');
    } else {
        setCurrentProduct(INITIAL_PRODUCT_STATE);
        setBenefitsText('');
    }
    setIsModalOpen(true);
  };

  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const newImageUrls = [...(currentProduct.images || [])];
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `products/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
        if (data.publicUrl) newImageUrls.push(data.publicUrl);
      }
    } catch (error) { alert("Upload failed. Please try again."); } 
    finally {
      const mainImage = currentProduct.image_url || newImageUrls[0];
      setCurrentProduct({ ...currentProduct, images: newImageUrls, image_url: mainImage });
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const finalBenefits = benefitsText.split(',').map(s => s.trim()).filter(Boolean);
    const payload = {
      ...currentProduct,
      price: Number(currentProduct.price),
      original_price: Number(currentProduct.original_price),
      stock: Number(currentProduct.stock || 0),
      volume_ml: Number(currentProduct.volume_ml || 0),
      weight: Number(currentProduct.weight || 0),
      benefits: finalBenefits,
      image_url: currentProduct.images?.[0] || null
    };
    const { id, created_at, ...cleanPayload } = payload; 
    const query = currentProduct.id 
      ? supabase.from('products').update(cleanPayload).eq('id', currentProduct.id)
      : supabase.from('products').insert([cleanPayload]);
    const { error } = await query;
    if (!error) { setIsModalOpen(false); fetchProducts(); } 
    else { alert('Error saving: ' + error.message); }
    setSaving(false);
  };

  // --- NEW LOGIC: Toggle Home with Limit Check ---
  const toggleShowOnHome = async (productId?: string, current?: boolean) => {
    if (!productId) return;
    
    // If we are turning it ON (currently false), check the limit
    if (!current) {
        const currentHomeCount = products.filter(p => p.show_on_home).length;
        if (currentHomeCount >= 4) {
            alert("Maximum 4 products allowed on Home. Please remove one first.");
            return;
        }
    }

    const { error } = await supabase.from('products').update({ show_on_home: !current }).eq('id', productId);
    if (error) return alert('Failed to update: ' + error.message);
    fetchProducts();
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-4 md:p-8 font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage catalog, pricing, and stock.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg hover:bg-zinc-800 transition-colors">
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-gray-50 text-[10px] font-bold uppercase text-gray-500 tracking-wider">
              <tr>
                <th className="p-4">Product Details</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                      {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={16} /></div>}
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 block truncate max-w-[180px]">{product.name}</span>
                      <span className="text-[10px] text-gray-500 uppercase block">{product.sku || 'NO SKU'}</span>
                    </div>
                  </td>
                  
                  {/* CATEGORY */}
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      <Tag size={10} className="mr-1.5" />
                      {product.category}
                    </span>
                  </td>

                  <td className="p-4 font-bold">₹{product.price}</td>

                  {/* STOCK */}
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       <div className={`h-2.5 w-2.5 rounded-full ${product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                       <div>
                          <p className={`text-xs font-bold ${product.stock > 10 ? 'text-green-700' : product.stock > 0 ? 'text-amber-700' : 'text-red-700'}`}>
                              {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{product.status?.replace('_', ' ')}</p>
                       </div>
                    </div>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleOpenModal(product)} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200"><Edit2 size={16} className="text-gray-400 hover:text-black"/></button>
                      <button onClick={() => { if(confirm('Delete?')) supabase.from('products').delete().eq('id', product.id).then(() => fetchProducts())}} className="p-2 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100"><Trash2 size={16} className="text-gray-400 hover:text-red-600"/></button>
                      
                      {/* HOME BUTTON - UPDATED DESIGN */}
                      <button 
                        onClick={() => toggleShowOnHome(product.id, product.show_on_home)} 
                        title={product.show_on_home ? 'Remove from Home' : 'Add to Home'} 
                        className={`p-2 rounded-lg border transition-all ${
                            product.show_on_home 
                            ? 'bg-green-100 border-green-200 text-green-700' // Green if active
                            : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50' // Gray if inactive
                        }`}
                      >
                        <Home size={16} /> 
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- FORM MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex-none px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">{currentProduct.id ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white rounded-full text-slate-400 hover:text-black hover:bg-slate-200 transition-colors shadow-sm"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white">
              <form id="product-form" onSubmit={handleSave}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                  {/* COL 1: Basic */}
                  <div className="space-y-5 border-b lg:border-b-0 lg:border-r border-gray-100 pb-6 lg:pb-0 lg:pr-6">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">1. Basic Information</h3>
                    <div><label className="input-label">Product Name</label><input required className="input-field" placeholder="e.g. Argan Hair Oil" value={currentProduct.name} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="input-label">SKU</label><input required className="input-field uppercase" placeholder="HO-001" value={currentProduct.sku} onChange={e => setCurrentProduct({...currentProduct, sku: e.target.value})} /></div>
                      <div><label className="input-label">Volume (ml)</label><input type="number" className="input-field" placeholder="200" value={currentProduct.volume_ml} onChange={e => setCurrentProduct({...currentProduct, volume_ml: Number(e.target.value)})} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="input-label">MRP (₹)</label><input type="number" required className="input-field" value={currentProduct.original_price} onChange={e => setCurrentProduct({...currentProduct, original_price: Number(e.target.value)})} /></div>
                      <div><label className="input-label">Sale Price (₹)</label><input type="number" required className="input-field" value={currentProduct.price} onChange={e => setCurrentProduct({...currentProduct, price: Number(e.target.value)})} /></div>
                      <div><label className="input-label">Benefits / Highlights</label><input className="input-field" placeholder="Sulphate Free..." value={benefitsText} onChange={e => setBenefitsText(e.target.value)} /></div>

                    </div>
                  </div>

                  {/* COL 2: Classification */}
                  <div className="space-y-5 border-b lg:border-b-0 lg:border-r border-gray-100 pb-6 lg:pb-0 lg:pr-6">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">2. Classification & Stock</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="input-label">Category</label><select className="input-field" value={currentProduct.category} onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}>{['Hair Oil', 'Shampoo', 'Conditioner', 'Hair Mask', 'Serum', 'Combo Kit'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                      <div><label className="input-label">Stock Status</label><select className="input-field" value={currentProduct.status} onChange={e => setCurrentProduct({...currentProduct, status: e.target.value})}><option value="in_stock">In Stock</option><option value="out_of_stock">Out of Stock</option><option value="pre_order">Pre-Order</option></select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="input-label">Stock Qty</label><input type="number" className="input-field" value={currentProduct.stock} onChange={e => setCurrentProduct({...currentProduct, stock: Number(e.target.value)})} /></div>
                      <div><label className="input-label">Weight (g)</label><input type="number" className="input-field" value={currentProduct.weight} onChange={e => setCurrentProduct({...currentProduct, weight: Number(e.target.value)})} /></div>
                    </div>
                    <div className="space-y-4 pt-2">
                        <MultiSelectDropdown label="Hair Type" options={HAIR_TYPE_OPTIONS} selectedValues={currentProduct.hair_type || []} onChange={(vals) => setCurrentProduct({...currentProduct, hair_type: vals})} />
                      
                      <MultiSelectDropdown label="Shop by Concern" options={CONCERN_OPTIONS} selectedValues={currentProduct.hair_concern || []} onChange={(vals) => setCurrentProduct({...currentProduct, hair_concern: vals})} />
                      <div><label className="input-label">Ingredients List</label><textarea rows={4} className="input-field" placeholder="Full ingredients list..." value={currentProduct.ingredients} onChange={e => setCurrentProduct({...currentProduct, ingredients: e.target.value})} /></div>

                    </div>
                  </div>

                  {/* COL 3: Media & Content */}
                  <div className="space-y-5">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">3. Media & Content</h3>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
                        {currentProduct.images?.map((img, i) => (
                          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 group flex-shrink-0 bg-white">
                            <img src={img} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setCurrentProduct({...currentProduct, images: currentProduct.images?.filter((_,idx) => idx !== i)})} className="absolute top-0 right-0 bg-black text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>
                          </div>
                        ))}
                      </div>
                      <label className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white hover:border-slate-400 transition-all text-slate-500 gap-2">
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleMultiImageUpload} />
                        {uploading ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />} <span className="text-xs font-bold uppercase">{uploading ? 'Uploading...' : 'Upload Images'}</span>
                      </label>
                    </div>

                    {/* NEW SHORT DESCRIPTION FIELD */}
                    <div><label className="input-label">Short Description</label><textarea rows={2} className="input-field resize-none" placeholder="Brief summary (e.g. Best for frizzy hair)..." value={currentProduct.short_description} onChange={e => setCurrentProduct({...currentProduct, short_description: e.target.value})} /></div>
                    <div><label className="input-label">Description (Main)</label><textarea rows={4} className="input-field" placeholder="Full detailed description..." value={currentProduct.description} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} /></div>
                    <div><label className="input-label">How to Use</label><textarea rows={4} className="input-field" placeholder="Step-by-step instructions..." value={currentProduct.how_to_use} onChange={e => setCurrentProduct({...currentProduct, how_to_use: e.target.value})} /></div>

                  </div>

                  {/* Footer */}
                  <div className="col-span-1 lg:col-span-3 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">

                  </div>

                </div>
              </form>
            </div>

            <div className="flex-none p-5 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-slate-300 text-slate-700 font-bold text-sm rounded-lg hover:bg-white transition-all">Cancel</button>
              <button type="submit" form="product-form" disabled={saving || uploading} className="px-6 py-2.5 bg-black text-white font-bold text-sm rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg">{saving && <Loader2 className="animate-spin" size={16} />} Save Product</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .input-label { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
        .input-field { width: 100%; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-weight: 600; color: #1e293b; outline: none; transition: all 0.2s; }
        .input-field:focus { border-color: #0f172a; background-color: #ffffff; box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.05); }
      `}</style>
    </div>
  );
}