'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Plus, Edit2, Trash2, X, Loader2,
  UploadCloud, Package, ChevronDown, Check,
  Home, ListOrdered, Layers, Tag, FlaskConical,
  ImageIcon, AlignLeft, Sparkles, ArrowUpRight,
  BarChart3, TrendingUp, ShoppingBag
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';

const HAIR_TYPE_OPTIONS = ['Oily', 'Dry', 'Sensitive', 'Normal'];
const CONCERN_OPTIONS = [
  'Hair Fall Control', 'Anti-Dandruff', 'Scalp Therapy',
  'Damage Repair', 'Frizz Control', 'Deep Hydration & Shine & Glow'
];

interface UsageStep { title: string; text: string; image: string; }
interface HeroIngredient { name: string; image: string; benefit1: string; benefit2: string; }
interface Product {
  id?: string; created_at?: string;
  name: string; sku: string; original_price: number; price: number;
  stock: number; status: string; category: string;
  hair_type: string[]; hair_concern: string[]; benefits: string[];
  short_description: string; description: string; ingredients: string;
  usage_steps: UsageStep[]; volume_ml: number; weight: number;
  images: string[]; image_url: string | null;
  before_image: string | null; after_image: string | null;
  is_visible: boolean; show_on_home?: boolean;
  // Hero Ingredients (for ProductTabs)
  hero_ingredients: HeroIngredient[];
  // Why Choose This
  comparison_our_image: string | null;
  comparison_other_image: string | null;
  comparison_promises_image: string | null;
  our_product_features: string[];
  others_features: string[];
  // Additional Information
  best_before: string;
  net_content: string;
  country_of_origin: string;
  manufactured_by: string;
  powered_by: string;
  marketed_by: string;
  customer_care_phone: string;
  customer_care_email: string;
}

const DEFAULT_STEPS = [
  { title: 'Apply', text: '', image: '' },
  { title: 'Massage', text: '', image: '' },
  { title: 'Rinse', text: '', image: '' }
];

const DEFAULT_HERO_INGREDIENTS: HeroIngredient[] = [
  { name: '', image: '', benefit1: '', benefit2: '' },
  { name: '', image: '', benefit1: '', benefit2: '' },
];

const INITIAL: Product = {
  name: '', sku: '', original_price: 0, price: 0, stock: 0,
  status: 'in_stock', category: 'Shampoo',
  hair_type: [], hair_concern: [], benefits: [],
  short_description: '', description: '', ingredients: '',
  usage_steps: DEFAULT_STEPS, volume_ml: 0, weight: 0,
  images: [], image_url: null, before_image: null, after_image: null,
  is_visible: true, show_on_home: false,
  // Hero Ingredients
  hero_ingredients: DEFAULT_HERO_INGREDIENTS,
  // Why Choose This
  comparison_our_image: null, comparison_other_image: null, comparison_promises_image: null,
  our_product_features: ['', '', ''],
  others_features: ['', '', ''],
  // Additional Information
  best_before: '18 Months', net_content: '', country_of_origin: 'India',
  manufactured_by: '', powered_by: '', marketed_by: '',
  customer_care_phone: '', customer_care_email: '',
};

// ─── MULTI SELECT ─────────────────────────────────────────────────────────────
function MultiSelect({ label, options, values, onChange }: {
  label: string; options: string[]; values: string[]; onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (o: string) =>
    onChange(values.includes(o) ? values.filter(v => v !== o) : [...values, o]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={S.fieldLabel}>{label}</div>
      <div
        onClick={() => setOpen(!open)}
        style={{
          ...S.input,
          minHeight: 38,
          display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          gap: 5, padding: '5px 10px', cursor: 'pointer',
          ...(open ? { borderColor: '#111', background: '#fff', boxShadow: '0 0 0 3px rgba(17,17,17,.07)' } : {})
        }}
      >
        {values.length === 0 && <span style={{ color: '#b8b3aa', fontSize: 13, fontWeight: 500 }}>Select options...</span>}
        {values.map(v => (
          <span key={v} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 7px', background: '#111', color: '#fff',
            borderRadius: 5, fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.04em'
          }}>
            {v}
            <button type="button"
              onClick={e => { e.stopPropagation(); onChange(values.filter(x => x !== v)); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.6)', display: 'flex', alignItems: 'center', padding: 0 }}>
              <X size={10} strokeWidth={3} />
            </button>
          </span>
        ))}
        <div style={{ marginLeft: 'auto', flexShrink: 0, color: '#c5c0b8', display: 'flex', alignItems: 'center' }}>
          <ChevronDown size={14} style={{ transition: 'transform .18s', transform: open ? 'rotate(180deg)' : 'none', color: open ? '#111' : '#c5c0b8' }} />
        </div>
      </div>
      {open && (
        <div style={{
          position: 'absolute', zIndex: 50, width: '100%', marginTop: 5,
          background: '#fff', border: '1px solid #e5e2d9',
          borderRadius: 12, boxShadow: '0 8px 36px rgba(0,0,0,.12)',
          padding: 5, maxHeight: 240, overflowY: 'auto'
        }}>
          {options.map(o => {
            const sel = values.includes(o);
            return (
              <div key={o} onClick={() => toggle(o)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 11px', borderRadius: 7, cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                color: sel ? '#111' : '#5a5650',
                background: sel ? '#faf9f6' : 'transparent',
                marginBottom: 1, transition: 'background .1s'
              }}>
                <span>{o}</span>
                {sel && <Check size={13} strokeWidth={3} style={{ color: '#111', flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHeader({ step, title, subtitle, icon: Icon }: {
  step: string; title: string; subtitle: string; icon: any;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 22px', background: '#faf9f7',
      borderBottom: '1px solid #f0ede6',
      position: 'sticky', top: 0, zIndex: 10
    }}>
      {/* step number */}
      <span style={{ fontSize: 10, fontWeight: 900, color: '#c8c3ba', letterSpacing: '0.05em', width: 22, textAlign: 'center', flexShrink: 0 }}>
        {step}
      </span>
      {/* icon box */}
      <div style={{
        width: 28, height: 28, background: '#fff',
        border: '1px solid #e5e2d9', borderRadius: 7,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#6a6460', flexShrink: 0
      }}>
        <Icon size={14} />
      </div>
      {/* text */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#111', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{title}</div>
        <div style={{ fontSize: 11, color: '#a09890', fontWeight: 500, marginTop: 1 }}>{subtitle}</div>
      </div>
    </div>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const S = {
  fieldLabel: {
    display: 'block', fontSize: 10, fontWeight: 800,
    textTransform: 'uppercase' as const, letterSpacing: '0.07em',
    color: '#7a7570', marginBottom: 5
  },
  input: {
    width: '100%', padding: '8px 11px', background: '#faf9f6',
    border: '1px solid #e5e2d9', borderRadius: 8,
    fontSize: 13, fontWeight: 600, color: '#1a1a1a',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const,
    transition: 'border-color .15s, background .15s, box-shadow .15s'
  },
  grid2: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12
  } as React.CSSProperties,
  sectionBody: { padding: '18px 22px' }
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const supabase = supabaseClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [benefitsText, setBenefitsText] = useState('');
  const [currentProduct, setCurrentProduct] = useState<Product>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) console.error(error);
    const safe = data?.map((p: any) => ({
      ...p,
      hair_type: p.hair_type || [],
      hair_concern: p.hair_concern || [],
      usage_steps: (p.usage_steps?.length === 3) ? p.usage_steps : DEFAULT_STEPS,
      show_on_home: p.show_on_home || false,
      hero_ingredients: (Array.isArray(p.hero_ingredients) && p.hero_ingredients.length > 0) ? p.hero_ingredients : DEFAULT_HERO_INGREDIENTS,
      our_product_features: Array.isArray(p.our_product_features) ? p.our_product_features : ['', '', ''],
      others_features: Array.isArray(p.others_features) ? p.others_features : ['', '', ''],
      comparison_our_image: p.comparison_our_image || null,
      comparison_other_image: p.comparison_other_image || null,
      comparison_promises_image: p.comparison_promises_image || null,
      best_before: p.best_before || '18 Months',
      net_content: p.net_content || '',
      country_of_origin: p.country_of_origin || 'India',
      manufactured_by: p.manufactured_by || '',
      powered_by: p.powered_by || '',
      marketed_by: p.marketed_by || '',
      customer_care_phone: p.customer_care_phone || '',
      customer_care_email: p.customer_care_email || '',
    }));
    if (safe) setProducts(safe as any);
    setLoading(false);
  };

  const openModal = (product?: Product) => {
    if (product) {
      setCurrentProduct({
        ...product,
        hair_type: Array.isArray(product.hair_type) ? product.hair_type : [],
        hair_concern: Array.isArray(product.hair_concern) ? product.hair_concern : [],
        usage_steps: (product.usage_steps?.length === 3) ? product.usage_steps : DEFAULT_STEPS,
        hero_ingredients: (Array.isArray(product.hero_ingredients) && product.hero_ingredients.length > 0) ? product.hero_ingredients : DEFAULT_HERO_INGREDIENTS,
        our_product_features: Array.isArray(product.our_product_features) ? product.our_product_features : ['', '', ''],
        others_features: Array.isArray(product.others_features) ? product.others_features : ['', '', ''],
      });
      setBenefitsText(product.benefits?.join(', ') || '');
    } else {
      setCurrentProduct(INITIAL);
      setBenefitsText('');
    }
    setIsModalOpen(true);
  };

  const uploadFile = async (file: File) => {
    const ext = file.name.split('.').pop();
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) { console.error(error); return null; }
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    const urls = [...(currentProduct.images || [])];
    for (const f of Array.from(e.target.files)) {
      const url = await uploadFile(f);
      if (url) urls.push(url);
    }
    setCurrentProduct(p => ({ ...p, images: urls, image_url: p.image_url || urls[0] }));
    setUploading(false);
    e.target.value = '';
  };

  const handleSingleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'before_image' | 'after_image') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file);
    if (url) setCurrentProduct(p => ({ ...p, [field]: url }));
    setUploading(false);
  };

  // Generic string field upload (for any string | null field)
  const handleFieldUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file);
    if (url) setCurrentProduct(p => ({ ...p, [field]: url }));
    setUploading(false);
  };

  const handleHeroIngredientImgUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file);
    if (url) {
      const updated = [...currentProduct.hero_ingredients];
      updated[idx] = { ...updated[idx], image: url };
      setCurrentProduct(p => ({ ...p, hero_ingredients: updated }));
    }
    setUploading(false);
  };

  const updateHeroIngredient = (idx: number, field: keyof HeroIngredient, val: string) => {
    const updated = [...currentProduct.hero_ingredients];
    updated[idx] = { ...updated[idx], [field]: val };
    setCurrentProduct(p => ({ ...p, hero_ingredients: updated }));
  };

  const updateListField = (field: 'our_product_features' | 'others_features', idx: number, val: string) => {
    const arr = [...(currentProduct[field] || [])];
    arr[idx] = val;
    setCurrentProduct(p => ({ ...p, [field]: arr }));
  };

  const updateStep = (idx: number, field: keyof UsageStep, val: string) => {
    const steps = [...currentProduct.usage_steps];
    steps[idx] = { ...steps[idx], [field]: val };
    setCurrentProduct(p => ({ ...p, usage_steps: steps }));
  };

  const handleStepImg = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file);
    if (url) updateStep(idx, 'image', url);
    setUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { id, created_at, ...clean } = {
      ...currentProduct,
      price: Number(currentProduct.price),
      original_price: Number(currentProduct.original_price),
      stock: Number(currentProduct.stock || 0),
      volume_ml: Number(currentProduct.volume_ml || 0),
      weight: Number(currentProduct.weight || 0),
      benefits: benefitsText.split(',').map(s => s.trim()).filter(Boolean),
      image_url: currentProduct.images?.[0] || null
    };
    const q = currentProduct.id
      ? supabase.from('products').update(clean).eq('id', currentProduct.id)
      : supabase.from('products').insert([clean]);
    const { error } = await q;
    if (!error) { setIsModalOpen(false); fetchProducts(); }
    else alert('Error saving: ' + error.message);
    setSaving(false);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm('Delete this product and all its images?')) return;
    setLoading(true);
    try {
      const allUrls = [
        ...(product.images || []),
        product.image_url, product.before_image, product.after_image,
        ...(product.usage_steps || []).map(s => s.image)
      ].filter((u): u is string => typeof u === 'string' && u.length > 0);
      const paths = [...new Set(allUrls)]
        .map(u => u.includes('/product-images/') ? u.split('/product-images/')[1] : null)
        .filter((p): p is string => p !== null);
      if (paths.length) await supabase.storage.from('product-images').remove(paths);
      const { error } = await supabase.from('products').delete().eq('id', product.id);
      if (error) throw error;
      await fetchProducts();
    } catch (err: any) { alert('Error: ' + err.message); }
    finally { setLoading(false); }
  };

  const toggleHome = async (id?: string, current?: boolean) => {
    if (!id) return;
    if (!current && products.filter(p => p.show_on_home).length >= 4) {
      alert('Max 4 products on Home. Remove one first.'); return;
    }
    const { error } = await supabase.from('products').update({ show_on_home: !current }).eq('id', id);
    if (error) alert('Failed: ' + error.message);
    else fetchProducts();
  };

  const stats = {
    total: products.length,
    inStock: products.filter(p => p.stock > 0).length,
    onHome: products.filter(p => p.show_on_home).length,
  };

  // Focus style handler
  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = '#111';
    e.target.style.background = '#fff';
    e.target.style.boxShadow = '0 0 0 3px rgba(17,17,17,.07)';
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = '#e5e2d9';
    e.target.style.background = '#faf9f6';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', padding: 32, fontFamily: "'DM Sans', -apple-system, sans-serif", color: '#1a1a1a' }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#9e9890', marginBottom: 6 }}>
            <ShoppingBag size={12} />
            <span>Catalog Management</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', color: '#111', lineHeight: 1, margin: 0 }}>Product Inventory</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Stats pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { icon: <BarChart3 size={12} />, text: <><strong style={{ color: '#111' }}>{stats.total}</strong> Products</> },
              { icon: <TrendingUp size={12} />, text: <><strong style={{ color: '#111' }}>{stats.inStock}</strong> In Stock</> },
            ].map((pill, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#fff', border: '1px solid #e5e2d9', borderRadius: 100, fontSize: 12, fontWeight: 600, color: '#5a5650' }}>
                {pill.icon}<span>{pill.text}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 100, fontSize: 12, fontWeight: 600, color: '#78350f' }}>
              <Home size={12} /><span><strong style={{ color: '#92400e' }}>{stats.onHome}</strong>/4 Home</span>
            </div>
          </div>
          {/* Add button */}
          <button onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#111', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={16} strokeWidth={2.5} /><span>Add Product</span>
          </button>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e2d9', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead>
              <tr style={{ background: '#faf9f7', borderBottom: '1px solid #ede9e0' }}>
                {['Product', 'Category', 'Pricing', 'Inventory', 'Actions'].map((h, i) => (
                  <th key={h} style={{ padding: '11px 16px', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a09890', textAlign: i === 4 ? 'right' : 'left' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#a09890', fontSize: 13, fontWeight: 500 }}>
                    <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Loading products...</span>
                  </div>
                </td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#a09890', fontSize: 13, fontWeight: 500 }}>
                    <Package size={32} style={{ color: '#d5d0c8' }} />
                    <span>No products yet. Add your first one!</span>
                  </div>
                </td></tr>
              ) : products.map(product => (
                <tr key={product.id} style={{ borderBottom: '1px solid #f0ede6' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div style={{ width: 42, height: 42, background: '#f5f4f0', border: '1px solid #e5e2d9', borderRadius: 10, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#c5c0b8' }}>
                        {product.image_url ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={17} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#b8b3aa', letterSpacing: '0.06em', marginTop: 2 }}>{product.sku || 'NO SKU'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ display: 'inline-flex', padding: '3px 9px', background: '#f5f4f0', border: '1px solid #e5e2d9', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#5a5650' }}>
                      {product.category}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>₹{product.price}</span>
                      {product.original_price > product.price && <span style={{ fontSize: 11, color: '#b8b3aa', textDecoration: 'line-through', fontWeight: 500 }}>₹{product.original_price}</span>}
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: product.stock > 10 ? '#22c55e' : product.stock > 0 ? '#f59e0b' : '#ef4444', boxShadow: `0 0 0 3px ${product.stock > 10 ? 'rgba(34,197,94,.15)' : product.stock > 0 ? 'rgba(245,158,11,.15)' : 'rgba(239,68,68,.15)'}` }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: product.stock > 10 ? '#15803d' : product.stock > 0 ? '#b45309' : '#dc2626' }}>
                          {product.stock > 0 ? `${product.stock} units` : 'Out of Stock'}
                        </div>
                        <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#b8b3aa', letterSpacing: '0.05em', fontWeight: 600, marginTop: 1 }}>{product.status?.replace('_', ' ')}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                      {[
                        { onClick: () => openModal(product), icon: <Edit2 size={14} />, hover: { bg: '#f5f4f0', border: '#e5e2d9', color: '#111' } },
                        { onClick: () => handleDelete(product), icon: <Trash2 size={14} />, hover: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626' } },
                      ].map((btn, i) => (
                        <ActionBtn key={i} onClick={btn.onClick} hoverBg={btn.hover.bg} hoverBorder={btn.hover.border} hoverColor={btn.hover.color}>
                          {btn.icon}
                        </ActionBtn>
                      ))}
                      <ActionBtn
                        onClick={() => toggleHome(product.id, product.show_on_home)}
                        hoverBg="#fffbeb" hoverBorder="#fde68a" hoverColor="#92400e"
                        active={product.show_on_home}
                        activeBg="#fffbeb" activeBorder="#fde68a" activeColor="#92400e"
                      >
                        <Home size={14} />
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL ── */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,8,5,.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 780, borderRadius: 20, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 100px rgba(0,0,0,.25)' }}>

            {/* Modal Header */}
            <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #f0ede6', background: '#faf9f7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, background: '#111', color: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.03em', color: '#111', lineHeight: 1.2 }}>
                    {currentProduct.id ? 'Edit Product' : 'New Product'}
                  </div>
                  <div style={{ fontSize: 11, color: '#a09890', fontWeight: 500, marginTop: 2 }}>Complete all sections for best catalog results</div>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ width: 32, height: 32, background: '#fff', border: '1px solid #e5e2d9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9e9890' }}>
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <form id="product-form" onSubmit={handleSave}>

                {/* ══ SECTION 01: BASIC INFO ══ */}
                <div style={{ borderBottom: '1px solid #f0ede6' }}>
                  <SectionHeader step="01" title="Basic Information" subtitle="Core product identity and pricing" icon={Tag} />
                  <div style={S.sectionBody}>
                    {/* Product Name */}
                    <div>
                      <label style={S.fieldLabel}>Product Name <span style={{ color: '#e55' }}>*</span></label>
                      <input required style={S.input} placeholder="e.g. Argan Hair Growth Oil"
                        value={currentProduct.name} onChange={e => setCurrentProduct(p => ({ ...p, name: e.target.value }))}
                        onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                    {/* Grid fields */}
                    <div style={{ ...S.grid2, marginTop: 12 }}>
                      <div>
                        <label style={S.fieldLabel}>SKU <span style={{ color: '#e55' }}>*</span></label>
                        <input required style={{ ...S.input, textTransform: 'uppercase' }} placeholder="HO-001"
                          value={currentProduct.sku} onChange={e => setCurrentProduct(p => ({ ...p, sku: e.target.value }))}
                          onFocus={focusStyle} onBlur={blurStyle} />
                      </div>
                      <div>
                        <label style={S.fieldLabel}>Volume (ml)</label>
                        <input type="number" style={S.input} placeholder="200"
                          value={currentProduct.volume_ml} onChange={e => setCurrentProduct(p => ({ ...p, volume_ml: Number(e.target.value) }))}
                          onFocus={focusStyle} onBlur={blurStyle} />
                      </div>
                      <div>
                        <label style={S.fieldLabel}>MRP (₹) <span style={{ color: '#e55' }}>*</span></label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 700, color: '#9e9890', pointerEvents: 'none', zIndex: 1 }}>₹</span>
                          <input type="number" required style={{ ...S.input, paddingLeft: 22 }}
                            value={currentProduct.original_price} onChange={e => setCurrentProduct(p => ({ ...p, original_price: Number(e.target.value) }))}
                            onFocus={focusStyle} onBlur={blurStyle} />
                        </div>
                      </div>
                      <div>
                        <label style={S.fieldLabel}>Sale Price (₹) <span style={{ color: '#e55' }}>*</span></label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 700, color: '#16a34a', pointerEvents: 'none', zIndex: 1 }}>₹</span>
                          <input type="number" required style={{ ...S.input, paddingLeft: 22 }}
                            value={currentProduct.price} onChange={e => setCurrentProduct(p => ({ ...p, price: Number(e.target.value) }))}
                            onFocus={focusStyle} onBlur={blurStyle} />
                        </div>
                      </div>
                      <div>
                        <label style={S.fieldLabel}>Stock Quantity</label>
                        <input type="number" style={S.input} value={currentProduct.stock}
                          onChange={e => setCurrentProduct(p => ({ ...p, stock: Number(e.target.value) }))}
                          onFocus={focusStyle} onBlur={blurStyle} />
                      </div>
                      <div>
                        <label style={S.fieldLabel}>Weight (g)</label>
                        <input type="number" style={S.input} value={currentProduct.weight}
                          onChange={e => setCurrentProduct(p => ({ ...p, weight: Number(e.target.value) }))}
                          onFocus={focusStyle} onBlur={blurStyle} />
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <label style={S.fieldLabel}>Benefits <span style={{ fontSize: 10, color: '#b8b3aa', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>— comma separated</span></label>
                      <input style={S.input} placeholder="Sulphate Free, Vegan, Paraben Free..."
                        value={benefitsText} onChange={e => setBenefitsText(e.target.value)}
                        onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                  </div>
                </div>

                {/* ══ SECTION 02: CLASSIFICATION ══ */}
                <div style={{ borderBottom: '1px solid #f0ede6' }}>
                  <SectionHeader step="02" title="Classification & Stock" subtitle="Category, hair type targeting, and availability status" icon={Layers} />
                  <div style={S.sectionBody}>
                    <div style={S.grid2}>
                      <div>
                        <label style={S.fieldLabel}>Category</label>
                        <select style={S.input} value={currentProduct.category}
                          onChange={e => setCurrentProduct(p => ({ ...p, category: e.target.value }))}
                          onFocus={focusStyle} onBlur={blurStyle}>
                          {['Hair Oil', 'Shampoo', 'Conditioner', 'Hair Mask', 'Serum', 'Combo Kit'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={S.fieldLabel}>Stock Status</label>
                        <select style={S.input} value={currentProduct.status}
                          onChange={e => setCurrentProduct(p => ({ ...p, status: e.target.value }))}
                          onFocus={focusStyle} onBlur={blurStyle}>
                          <option value="in_stock">In Stock</option>
                          <option value="out_of_stock">Out of Stock</option>
                          <option value="pre_order">Pre-Order</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ ...S.grid2, marginTop: 12 }}>
                      <MultiSelect label="Hair Type" options={HAIR_TYPE_OPTIONS} values={currentProduct.hair_type || []} onChange={v => setCurrentProduct(p => ({ ...p, hair_type: v }))} />
                      <MultiSelect label="Shop by Concern" options={CONCERN_OPTIONS} values={currentProduct.hair_concern || []} onChange={v => setCurrentProduct(p => ({ ...p, hair_concern: v }))} />
                    </div>
                  </div>
                </div>

                {/* ══ SECTION 03: DESCRIPTIONS ══ */}
                <div style={{ borderBottom: '1px solid #f0ede6' }}>
                  <SectionHeader step="03" title="Descriptions & Ingredients" subtitle="Product copy and formulation details shown to customers" icon={AlignLeft} />
                  <div style={S.sectionBody}>
                    <div>
                      <label style={S.fieldLabel}>Short Description</label>
                      <textarea rows={2} style={{ ...S.input, resize: 'vertical', lineHeight: 1.55 }}
                        placeholder="Brief 1–2 line summary for listing cards..."
                        value={currentProduct.short_description}
                        onChange={e => setCurrentProduct(p => ({ ...p, short_description: e.target.value }))}
                        onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <label style={S.fieldLabel}>
                        Main Description <span style={{ fontSize: 10, color: '#b8b3aa', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>— Enter for new paragraphs</span>
                      </label>
                      <textarea rows={6} style={{ ...S.input, resize: 'vertical', lineHeight: 1.55 }}
                        placeholder="Full product description..."
                        value={currentProduct.description}
                        onChange={e => setCurrentProduct(p => ({ ...p, description: e.target.value }))}
                        onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <label style={{ ...S.fieldLabel, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <FlaskConical size={11} /> Ingredients
                      </label>
                      <textarea rows={3} style={{ ...S.input, resize: 'vertical', fontFamily: 'SFMono-Regular, Consolas, monospace', fontSize: 12 }}
                        placeholder="Aqua, Argan Oil, Aloe Vera Extract..."
                        value={currentProduct.ingredients}
                        onChange={e => setCurrentProduct(p => ({ ...p, ingredients: e.target.value }))}
                        onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                  </div>
                </div>

                {/* ══ SECTION 04: MEDIA ══ */}
                <div style={{ borderBottom: '1px solid #f0ede6' }}>
                  <SectionHeader step="04" title="Media & Gallery" subtitle="Product images, gallery, and before/after transformation visuals" icon={ImageIcon} />
                  <div style={S.sectionBody}>

                    {/* Gallery */}
                    <div>
                      <label style={S.fieldLabel}>Product Gallery</label>
                      <div style={{ background: '#faf9f6', border: '1px solid #e5e2d9', borderRadius: 12, padding: 12 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' }}>
                          {currentProduct.images?.map((img, i) => (
                            <div key={i} style={{ position: 'relative', width: 68, height: 68, borderRadius: 9, overflow: 'hidden', border: '1px solid #e5e2d9', flexShrink: 0 }}>
                              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              {i === 0 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.62)', color: '#fff', fontSize: 7, fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', padding: 3, letterSpacing: '0.06em' }}>Main</div>}
                              <button type="button" onClick={() => setCurrentProduct(p => ({ ...p, images: p.images.filter((_, j) => j !== i) }))}
                                style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,.65)', color: '#fff', border: 'none', borderRadius: 4, width: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <X size={11} strokeWidth={2.5} />
                              </button>
                            </div>
                          ))}
                          <label style={{ width: 68, height: 68, border: '2px dashed #d5d0c8', borderRadius: 9, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, cursor: 'pointer', color: '#a09890', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                            <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleGalleryUpload} />
                            {uploading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <UploadCloud size={20} />}
                            <span>Add</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Before / After */}
                    <div style={{ marginTop: 16 }}>
                      <label style={S.fieldLabel}>Before / After Transformation</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {(['before_image', 'after_image'] as const).map(field => (
                          <div key={field}>
                            <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: field === 'after_image' ? '#16803d' : '#8b8577', marginBottom: 5 }}>
                              {field === 'before_image' ? 'Before' : 'After'}
                            </div>
                            <div style={{ aspectRatio: '1', background: '#faf9f6', border: '1px solid #e5e2d9', borderRadius: 12, overflow: 'hidden' }}>
                              {currentProduct[field] ? (
                                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                  <img src={currentProduct[field]!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <button type="button" onClick={() => setCurrentProduct(p => ({ ...p, [field]: null }))}
                                    style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <X size={11} />
                                  </button>
                                </div>
                              ) : (
                                <label style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer', color: '#b8b3aa', fontSize: 11, fontWeight: 600 }}>
                                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleSingleUpload(e, field)} />
                                  <UploadCloud size={22} />
                                  <span>{field === 'before_image' ? 'Upload Before' : 'Upload After'}</span>
                                </label>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ══ SECTION 05: HOW TO USE ══ */}
                <div>
                  <SectionHeader step="05" title="How to Use" subtitle="3-step usage instructions displayed on the product page" icon={ListOrdered} />
                  <div style={S.sectionBody}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      {currentProduct.usage_steps.map((step, idx) => (
                        <div key={idx} style={{ background: '#faf9f6', border: '1px solid #e5e2d9', borderRadius: 14, overflow: 'hidden' }}>
                          {/* Step badge */}
                          <div style={{ padding: '8px 13px 7px', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a09890', borderBottom: '1px solid #f0ede6', background: '#fff' }}>
                            Step {idx + 1}
                          </div>
                          {/* Step image */}
                          <div style={{ aspectRatio: '4/3', background: '#edeae2', overflow: 'hidden' }}>
                            {step.image ? (
                              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                <img src={step.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button type="button" onClick={() => updateStep(idx, 'image', '')}
                                  style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', borderRadius: 5, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                  <X size={11} />
                                </button>
                              </div>
                            ) : (
                              <label style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', color: '#b8b3aa', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleStepImg(idx, e)} />
                                <UploadCloud size={20} />
                                <span>Step Image</span>
                              </label>
                            )}
                          </div>
                          {/* Step fields */}
                          <div style={{ padding: 11 }}>
                            <div>
                              <label style={S.fieldLabel}>Title</label>
                              <input style={S.input} value={step.title}
                                onChange={e => updateStep(idx, 'title', e.target.value)}
                                placeholder={['Apply', 'Massage', 'Rinse'][idx]}
                                onFocus={focusStyle} onBlur={blurStyle} />
                            </div>
                            <div style={{ marginTop: 8 }}>
                              <label style={S.fieldLabel}>Instruction</label>
                              <textarea rows={3} style={{ ...S.input, resize: 'vertical', lineHeight: 1.5 }}
                                value={step.text} onChange={e => updateStep(idx, 'text', e.target.value)}
                                placeholder="Describe this step..."
                                onFocus={focusStyle} onBlur={blurStyle} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </form>

              {/* ══ SECTION 06: HERO INGREDIENTS ══ */}
              <div style={{ borderBottom: '1px solid #f0ede6' }}>
                <SectionHeader step="06" title="Hero Ingredients" subtitle="Up to 2 featured ingredients shown in the Description tab" icon={FlaskConical} />
                <div style={S.sectionBody}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {(currentProduct.hero_ingredients || DEFAULT_HERO_INGREDIENTS).map((ing, idx) => (
                      <div key={idx} style={{ background: '#faf9f6', border: '1px solid #e5e2d9', borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ padding: '8px 13px 7px', fontSize: 9, fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#a09890', borderBottom: '1px solid #f0ede6', background: '#fff' }}>
                          Ingredient {idx + 1}
                        </div>
                        <div style={{ padding: 12 }}>
                          <div style={{ marginBottom: 10 }}>
                            <label style={S.fieldLabel}>Ingredient Image</label>
                            <div style={{ width: '100%', aspectRatio: '4/3' as any, background: '#edeae2', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e2d9' }}>
                              {ing.image ? (
                                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                  <img src={ing.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <button type="button" onClick={() => updateHeroIngredient(idx, 'image', '')}
                                    style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', borderRadius: 5, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <X size={11} />
                                  </button>
                                </div>
                              ) : (
                                <label style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', color: '#b8b3aa', fontSize: 9, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleHeroIngredientImgUpload(idx, e)} />
                                  <UploadCloud size={20} /><span>Upload Image</span>
                                </label>
                              )}
                            </div>
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <label style={S.fieldLabel}>Ingredient Name</label>
                            <input style={S.input} placeholder="e.g. Argan Oil" value={ing.name}
                              onChange={e => updateHeroIngredient(idx, 'name', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <label style={S.fieldLabel}>Benefit 1</label>
                            <input style={S.input} placeholder="e.g. Deeply nourishes scalp" value={ing.benefit1}
                              onChange={e => updateHeroIngredient(idx, 'benefit1', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
                          </div>
                          <div>
                            <label style={S.fieldLabel}>Benefit 2</label>
                            <input style={S.input} placeholder="e.g. Reduces frizz & adds shine" value={ing.benefit2}
                              onChange={e => updateHeroIngredient(idx, 'benefit2', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ══ SECTION 07: WHY CHOOSE THIS ══ */}
              <div style={{ borderBottom: '1px solid #f0ede6' }}>
                <SectionHeader step="07" title="Why Choose This?" subtitle="Comparison images & feature lists shown in the Why Choose tab" icon={Layers} />
                <div style={S.sectionBody}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
                    {([
                      { field: 'comparison_our_image', label: 'Our Product Image', labelColor: '#16803d' },
                      { field: 'comparison_other_image', label: 'Competitor Image', labelColor: '#8b8577' },
                      { field: 'comparison_promises_image', label: 'Promises / Badge Image', labelColor: '#7c3aed' },
                    ]).map(({ field, label, labelColor }) => {
                      const val = (currentProduct as any)[field] as string | null;
                      return (
                        <div key={field}>
                          <label style={{ ...S.fieldLabel, color: labelColor }}>{label}</label>
                          <div style={{ aspectRatio: '3/4' as any, background: '#faf9f6', border: '1px solid #e5e2d9', borderRadius: 12, overflow: 'hidden' }}>
                            {val ? (
                              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                <img src={val} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
                                <button type="button" onClick={() => setCurrentProduct(p => ({ ...p, [field]: null }))}
                                  style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <label style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer', color: '#b8b3aa', fontSize: 11, fontWeight: 600 }}>
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFieldUpload(e, field)} />
                                <UploadCloud size={22} />
                                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Upload</span>
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ ...S.fieldLabel, color: '#16803d' }}>Our Product Features</label>
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                        {(currentProduct.our_product_features || ['', '', '']).map((feat, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 20, height: 20, background: '#dcfce7', border: '1px solid #86efac', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#16803d', flexShrink: 0 }}>✓</span>
                            <input style={S.input} placeholder={`Feature ${i + 1}`} value={feat}
                              onChange={e => updateListField('our_product_features', i, e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
                          </div>
                        ))}
                        <button type="button" onClick={() => setCurrentProduct(p => ({ ...p, our_product_features: [...(p.our_product_features || []), ''] }))}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', background: 'transparent', border: '1px dashed #d5d0c8', borderRadius: 7, fontSize: 11, fontWeight: 700, color: '#a09890', cursor: 'pointer', fontFamily: 'inherit', marginTop: 2 }}>
                          <Plus size={12} /> Add Feature
                        </button>
                      </div>
                    </div>
                    <div>
                      <label style={{ ...S.fieldLabel, color: '#8b8577' }}>Others / Competitor Features</label>
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                        {(currentProduct.others_features || ['', '', '']).map((feat, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 20, height: 20, background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#94a3b8', flexShrink: 0 }}>✓</span>
                            <input style={S.input} placeholder={`Feature ${i + 1}`} value={feat}
                              onChange={e => updateListField('others_features', i, e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
                          </div>
                        ))}
                        <button type="button" onClick={() => setCurrentProduct(p => ({ ...p, others_features: [...(p.others_features || []), ''] }))}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', background: 'transparent', border: '1px dashed #d5d0c8', borderRadius: 7, fontSize: 11, fontWeight: 700, color: '#a09890', cursor: 'pointer', fontFamily: 'inherit', marginTop: 2 }}>
                          <Plus size={12} /> Add Feature
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ══ SECTION 08: ADDITIONAL INFORMATION ══ */}
              <div>
                <SectionHeader step="08" title="Additional Information" subtitle="Regulatory, manufacturing & customer care details" icon={AlignLeft} />
                <div style={S.sectionBody}>
                  <div style={S.grid2}>
                    <div>
                      <label style={S.fieldLabel}>Best Before</label>
                      <input style={S.input} placeholder="e.g. 18 Months" value={currentProduct.best_before || ''}
                        onChange={e => setCurrentProduct(p => ({ ...p, best_before: e.target.value }))} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                    <div>
                      <label style={S.fieldLabel}>Net Content</label>
                      <input style={S.input} placeholder="e.g. 250 ml" value={currentProduct.net_content || ''}
                        onChange={e => setCurrentProduct(p => ({ ...p, net_content: e.target.value }))} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                    <div>
                      <label style={S.fieldLabel}>Country of Origin</label>
                      <input style={S.input} placeholder="e.g. India" value={currentProduct.country_of_origin || ''}
                        onChange={e => setCurrentProduct(p => ({ ...p, country_of_origin: e.target.value }))} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                    <div>
                      <label style={S.fieldLabel}>Powered By</label>
                      <input style={S.input} placeholder="e.g. Innovist" value={currentProduct.powered_by || ''}
                        onChange={e => setCurrentProduct(p => ({ ...p, powered_by: e.target.value }))} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                    <div>
                      <label style={S.fieldLabel}>Customer Care Phone</label>
                      <input style={S.input} placeholder="+91 98765 43210" value={currentProduct.customer_care_phone || ''}
                        onChange={e => setCurrentProduct(p => ({ ...p, customer_care_phone: e.target.value }))} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                    <div>
                      <label style={S.fieldLabel}>Customer Care Email</label>
                      <input style={S.input} placeholder="support@brand.com" value={currentProduct.customer_care_email || ''}
                        onChange={e => setCurrentProduct(p => ({ ...p, customer_care_email: e.target.value }))} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={S.fieldLabel}>Manufactured By</label>
                    <textarea rows={2} style={{ ...S.input, resize: 'vertical', lineHeight: 1.55 }}
                      placeholder="Company name and full manufacturing address..."
                      value={currentProduct.manufactured_by || ''}
                      onChange={e => setCurrentProduct(p => ({ ...p, manufactured_by: e.target.value }))} onFocus={focusStyle} onBlur={blurStyle} />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={S.fieldLabel}>Marketed By</label>
                    <textarea rows={2} style={{ ...S.input, resize: 'vertical', lineHeight: 1.55 }}
                      placeholder="Company name and full marketing address..."
                      value={currentProduct.marketed_by || ''}
                      onChange={e => setCurrentProduct(p => ({ ...p, marketed_by: e.target.value }))} onFocus={focusStyle} onBlur={blurStyle} />
                  </div>
                </div>
              </div>

            </div>
            <div style={{ flexShrink: 0, padding: '13px 22px', borderTop: '1px solid #f0ede6', background: '#faf9f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#a09890', fontWeight: 500 }}>
                <ArrowUpRight size={12} />
                <span>Changes are saved to your catalog immediately</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 16px', background: '#fff', border: '1px solid #e5e2d9', borderRadius: 9, fontSize: 13, fontWeight: 700, color: '#5a5650', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button type="submit" form="product-form" disabled={saving || uploading}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', background: saving || uploading ? '#555' : '#111', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: saving || uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(0,0,0,.18)' }}>
                  {saving && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                  {saving ? 'Saving...' : currentProduct.id ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #b8b3aa; font-weight: 500; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
        table tr:hover { background: #faf9f7; }
        select { appearance: auto; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-thumb { background: #e0dcd4; border-radius: 100px; }
      `}</style>
    </div>
  );
}

// ─── ACTION BUTTON HELPER ─────────────────────────────────────────────────────
function ActionBtn({ children, onClick, hoverBg, hoverBorder, hoverColor, active, activeBg, activeBorder, activeColor }: {
  children: React.ReactNode; onClick: () => void;
  hoverBg: string; hoverBorder: string; hoverColor: string;
  active?: boolean; activeBg?: string; activeBorder?: string; activeColor?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const isActive = active && activeBg;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 8, cursor: 'pointer',
        background: isActive ? activeBg! : hovered ? hoverBg : 'transparent',
        border: `1px solid ${isActive ? activeBorder! : hovered ? hoverBorder : 'transparent'}`,
        color: isActive ? activeColor! : hovered ? hoverColor : '#c5c0b8',
        transition: 'all .15s'
      }}
    >
      {children}
    </button>
  );
}