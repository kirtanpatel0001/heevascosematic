'use client';

import { useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import {
  Loader2, Plus, Trash2, Ticket, Copy, Check,
  ChevronDown, ChevronUp, Users, ShoppingBag,
  Percent, IndianRupee, ToggleLeft, ToggleRight,
  Sparkles, TrendingUp, AlertCircle, CheckCircle2,
  X, Tag,
} from 'lucide-react';

interface Redemption {
  id: string;
  user_id: string;
  order_id: string;
  created_at: string;
  user: { email: string; full_name: string | null } | null;
}

interface Coupon {
  id: string;
  code: string;
  discount_value: number;
  discount_type: string;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
  description: string | null;
  redemptions?: Redemption[];
}

interface Props {
  initialCoupons: Coupon[];
}

// ── Modal for creating a new coupon ──────────────────────────
function CreateCouponModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: {
    code: string;
    discount_value: number;
    discount_type: string;
    usage_limit: number;
    description: string;
  }) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: Math.random().toString(36).substring(2, 8).toUpperCase(),
    discount_value: 20,
    discount_type: 'percentage',
    usage_limit: 50,
    description: '',
  });

  const handle = async () => {
    setSaving(true);
    await onCreate(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
              <Ticket size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Create Coupon</h3>
              <p className="text-[11px] text-slate-400">Set up a new discount code</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Code */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Coupon Code</label>
            <div className="flex gap-2">
              <input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
              />
              <button
                onClick={() => setForm(f => ({ ...f, code: Math.random().toString(36).substring(2, 8).toUpperCase() }))}
                className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-slate-600 transition-colors whitespace-nowrap"
              >
                Randomize
              </button>
            </div>
          </div>

          {/* Discount type */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Discount Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['percentage', 'fixed'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setForm(f => ({ ...f, discount_type: type }))}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all
                    ${form.discount_type === type ? 'border-black bg-black text-white' : 'border-gray-200 text-slate-600 hover:border-gray-300'}`}
                >
                  {type === 'percentage' ? <Percent size={14} /> : <IndianRupee size={14} />}
                  {type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                </button>
              ))}
            </div>
          </div>

          {/* Value + Limit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                {form.discount_type === 'percentage' ? 'Discount %' : 'Amount (₹)'}
              </label>
              <input
                type="number"
                value={form.discount_value}
                onChange={e => setForm(f => ({ ...f, discount_value: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Usage Limit</label>
              <input
                type="number"
                value={form.usage_limit}
                onChange={e => setForm(f => ({ ...f, usage_limit: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Description <span className="normal-case font-normal">(optional)</span></label>
            <input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="e.g. Welcome offer for new users"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black placeholder-slate-300"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-gray-200 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={saving || !form.code.trim()}
            className="px-5 py-2 bg-black text-white text-sm font-black rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Create Coupon
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function CouponsClient({ initialCoupons }: Props) {
  const supabase = supabaseClient();
  const [coupons, setCoupons]     = useState<Coupon[]>(initialCoupons);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId]   = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingRed, setLoadingRed] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCoupons = async () => {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (data) setCoupons(data as Coupon[]);
  };

  const handleCreate = async (data: {
    code: string; discount_value: number; discount_type: string;
    usage_limit: number; description: string;
  }) => {
    const { error } = await supabase.from('coupons').insert([{
      ...data,
      used_count: 0,
      is_active: true,
    }]);
    if (error) { showToast('Failed to create coupon: ' + error.message, 'error'); }
    else {
      await fetchCoupons();
      setShowModal(false);
      showToast('Coupon created successfully!');
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon? This cannot be undone.')) return;
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) showToast('Failed to delete: ' + error.message, 'error');
    else { setCoupons(prev => prev.filter(c => c.id !== id)); showToast('Coupon deleted.'); }
  };

  const toggleActive = async (coupon: Coupon) => {
    setTogglingId(coupon.id);
    const { error } = await supabase.from('coupons').update({ is_active: !coupon.is_active }).eq('id', coupon.id);
    if (!error) {
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
      showToast(coupon.is_active ? 'Coupon deactivated.' : 'Coupon activated!');
    }
    setTogglingId(null);
  };

  const copyCode = (id: string, code: string) => {
    // Copy clean code — no spaces or hidden characters
    navigator.clipboard.writeText(code.trim().toUpperCase());
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleRedemptions = async (coupon: Coupon) => {
    if (expandedId === coupon.id) { setExpandedId(null); return; }
    setExpandedId(coupon.id);
    if (coupon.redemptions !== undefined) return;
    setLoadingRed(coupon.id);
    const { data, error } = await supabase
      .from('coupon_redemptions')
      .select('id, user_id, order_id, created_at, user:profiles(email, full_name)')
      .eq('coupon_id', coupon.id)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, redemptions: data as Redemption[] } : c));
    }
    setLoadingRed(null);
  };

  // Stats
  const totalActive   = coupons.filter(c => c.is_active).length;
  const totalUsed     = coupons.reduce((a, c) => a + c.used_count, 0);
  const exhausted     = coupons.filter(c => c.used_count >= c.usage_limit).length;

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all
          ${toast.type === 'success'
            ? 'bg-white border-emerald-200 text-emerald-800'
            : 'bg-white border-red-200 text-red-800'
          }`}>
          {toast.type === 'success'
            ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            : <AlertCircle size={16} className="text-red-500 shrink-0" />
          }
          {toast.msg}
        </div>
      )}

      {showModal && (
        <CreateCouponModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
                <Ticket size={17} className="text-white" />
              </div>
              Coupon Manager
            </h1>
            <p className="text-slate-500 text-sm mt-1.5 ml-0.5">
              Manage discount codes and track redemptions
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-black text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Create Coupon
          </button>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Coupons', value: coupons.length,  color: 'text-slate-900',  bg: 'bg-white' },
            { label: 'Active',        value: totalActive,     color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
            { label: 'Total Used',    value: totalUsed,       color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-100' },
            { label: 'Exhausted',     value: exhausted,       color: 'text-red-700',     bg: 'bg-red-50 border-red-100' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl border border-gray-100 px-5 py-4`}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {coupons.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4 text-slate-400">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                <Tag size={28} className="opacity-30" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-600 mb-1">No coupons yet</p>
                <p className="text-sm">Create your first coupon to get started.</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="mt-2 flex items-center gap-2 bg-black text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <Plus size={15} /> Create Coupon
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    {['Code', 'Discount', 'Usage', 'Status', 'Active', 'Created', ''].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => {
                    const isExhausted = c.used_count >= c.usage_limit;
                    const isExpanded  = expandedId === c.id;
                    const fillPct     = Math.min((c.used_count / c.usage_limit) * 100, 100);

                    return (
                      <>
                        <tr
                          key={c.id}
                          className={`border-t border-gray-50 transition-colors
                            ${isExpanded ? 'bg-indigo-50/40' : 'hover:bg-gray-50/60'}`}
                        >
                          {/* Code */}
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-slate-900 bg-gray-100 px-2.5 py-1 rounded-lg text-sm tracking-widest">
                                  {c.code}
                                </span>
                                <button
                                  onClick={() => copyCode(c.id, c.code)}
                                  className="p-1 text-slate-300 hover:text-slate-700 transition-colors rounded"
                                  title="Copy"
                                >
                                  {copiedId === c.id
                                    ? <Check size={13} className="text-emerald-500" />
                                    : <Copy size={13} />}
                                </button>
                              </div>
                              {c.description && (
                                <p className="text-[11px] text-slate-400 max-w-[200px] truncate pl-0.5">{c.description}</p>
                              )}
                            </div>
                          </td>

                          {/* Discount */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 text-sm font-black px-2.5 py-1 rounded-lg
                              ${c.discount_type === 'percentage'
                                ? 'bg-violet-50 text-violet-700'
                                : 'bg-amber-50 text-amber-700'
                              }`}>
                              {c.discount_type === 'percentage'
                                ? <><Percent size={12} />{c.discount_value}%</>
                                : <><IndianRupee size={12} />{c.discount_value}</>
                              }
                            </span>
                          </td>

                          {/* Usage */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="relative">
                                <div className="bg-gray-100 rounded-full h-2 w-24 overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-500
                                      ${fillPct >= 100 ? 'bg-red-500' : fillPct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${fillPct}%` }}
                                  />
                                </div>
                              </div>
                              <span className={`text-xs font-black tabular-nums
                                ${isExhausted ? 'text-red-500' : 'text-slate-600'}`}>
                                {c.used_count}<span className="text-slate-300 font-normal">/{c.usage_limit}</span>
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            {isExhausted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700 border border-red-200">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                Exhausted
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                Available
                              </span>
                            )}
                          </td>

                          {/* Active toggle */}
                          <td className="px-5 py-4">
                            <button
                              onClick={() => toggleActive(c)}
                              disabled={togglingId === c.id}
                              className="transition-all disabled:opacity-40 hover:scale-105"
                              title={c.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {togglingId === c.id
                                ? <Loader2 size={22} className="animate-spin text-slate-300" />
                                : c.is_active
                                  ? <ToggleRight size={26} className="text-emerald-500" />
                                  : <ToggleLeft size={26} className="text-slate-300" />
                              }
                            </button>
                          </td>

                          {/* Created */}
                          <td className="px-5 py-4 text-xs text-slate-400 font-medium whitespace-nowrap">
                            {new Date(c.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => toggleRedemptions(c)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                                  ${isExpanded
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border-transparent hover:border-indigo-100'
                                  }`}
                                title="View who redeemed"
                              >
                                {loadingRed === c.id
                                  ? <Loader2 size={12} className="animate-spin" />
                                  : <Users size={12} />}
                                {c.used_count}
                                {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                              </button>
                              <button
                                onClick={() => deleteCoupon(c.id)}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* ── Redemptions panel ── */}
                        {isExpanded && (
                          <tr key={`${c.id}-exp`}>
                            <td colSpan={7} className="bg-indigo-50/30 border-t border-indigo-100/60 px-6 py-5">
                              {loadingRed === c.id ? (
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                  <Loader2 size={14} className="animate-spin" />
                                  Loading redemptions…
                                </div>
                              ) : c.redemptions && c.redemptions.length > 0 ? (
                                <div>
                                  <div className="flex items-center gap-2 mb-4">
                                    <TrendingUp size={13} className="text-indigo-500" />
                                    <p className="text-xs font-black uppercase tracking-widest text-indigo-600">
                                      {c.redemptions.length} Redemption{c.redemptions.length !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                  <div className="grid gap-2 max-h-72 overflow-y-auto pr-1">
                                    {c.redemptions.map(r => (
                                      <div
                                        key={r.id}
                                        className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm hover:border-indigo-100 transition-colors"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full flex items-center justify-center text-white font-black text-xs uppercase shadow-sm shrink-0">
                                            {(r.user?.full_name || r.user?.email || '?')[0]}
                                          </div>
                                          <div>
                                            <p className="text-sm font-bold text-slate-800 leading-tight">
                                              {r.user?.full_name || 'Unknown User'}
                                            </p>
                                            <p className="text-[11px] text-slate-400">{r.user?.email || r.user_id}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0">
                                          <div className="flex items-center gap-1.5">
                                            <ShoppingBag size={12} className="text-slate-400" />
                                            <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                              #{r.order_id.slice(0, 8).toUpperCase()}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-slate-400 whitespace-nowrap">
                                            {new Date(r.created_at).toLocaleDateString('en-IN', {
                                              day: 'numeric', month: 'short', year: 'numeric',
                                            })}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2.5 text-slate-400 text-sm py-1">
                                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                                    <Users size={14} className="opacity-40" />
                                  </div>
                                  No redemptions yet for this coupon.
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}