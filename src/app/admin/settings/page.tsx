'use client';

import { useState, useEffect } from 'react';
import { 
  Save, 
  Store, 
  Truck, 
  CreditCard, 
  Percent, 
  Globe, 
  Mail, 
  Phone, 
  Loader2, 
  CheckCircle2, 
  Banknote, 
  MapPin 
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';

export default function SettingsPage() {
  const supabase = supabaseClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Default state matches your DB structure
  const [settings, setSettings] = useState({
    store_name: '',
    support_email: '',
    support_phone: '',
    currency: 'INR',
    delivery_charge: 0,
    free_shipping_threshold: 0,
    enable_express: false,
    express_charge: 0,
    tax_name: 'GST',
    tax_rate: 0,
    enable_cod: true,
    enable_online: true,
  });

  // --- 1. FETCH SETTINGS ---
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (data) setSettings(data);
      setLoading(false);
    };
    fetchSettings();
  }, []);

  // --- 2. HANDLE CHANGES ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setSettings(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setSettings(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  // --- 3. SAVE TO DB ---
  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('store_settings')
      .update(settings)
      .eq('id', 1);

    if (error) {
      alert('Error updating settings');
    } else {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
    setSaving(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="min-h-screen pb-20 font-sans text-slate-900 bg-[#F8F9FC] max-w-5xl mx-auto p-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Settings</h1>
          <p className="text-slate-500 font-medium mt-1">Control your store's behavior globally.</p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-fit bg-black text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* SUCCESS TOAST */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
           <div className="bg-emerald-500 rounded-full p-1 text-slate-900">
             <CheckCircle2 size={16} />
           </div>
           <div>
             <p className="text-sm font-bold">Settings Saved</p>
             <p className="text-[10px] text-slate-400">Your changes are now live.</p>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">

        {/* 1. GENERAL INFORMATION */}
        <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Store size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">General Information</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Store Identity & Contact</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2 group">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Store Name</label>
              <div className="relative">
               
                <input 
                  type="text" 
                  name="store_name"
                  value={settings.store_name || ''}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl font-bold text-slate-900 outline-none transition-all" 
                />
              </div>
            </div>
            <div className="space-y-2 group">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Support Email</label>
              <div className="relative">
                
                <input 
                  type="email" 
                  name="support_email"
                  value={settings.support_email || ''}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl font-bold text-slate-900 outline-none transition-all" 
                />
              </div>
            </div>
            <div className="space-y-2 group">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Support Phone</label>
              <div className="relative">
                <input 
                  type="text" 
                  name="support_phone"
                  value={settings.support_phone || ''}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl font-bold text-slate-900 outline-none transition-all" 
                />
              </div>
            </div>
            <div className="space-y-2 group">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Currency</label>
              <div className="relative">
                <select 
                  name="currency"
                  value={settings.currency || 'INR'}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl font-bold text-slate-900 outline-none transition-all appearance-none cursor-pointer" 
                >
                  <option value="INR">Indian Rupee (INR)</option>
                  <option value="USD">US Dollar (USD)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 2. SHIPPING & DELIVERY */}
        <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Truck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Shipping & Delivery</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Logistics Configuration</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Standard */}
            <div className="p-6 bg-[#F8FCFA] rounded-2xl border border-emerald-100/50">
               <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                     <MapPin size={18} className="text-emerald-600" />
                     <h3 className="font-bold text-slate-900">Standard Delivery</h3>
                  </div>
                  <span className="text-[10px] font-black uppercase bg-white border border-emerald-100 px-2 py-1 rounded text-emerald-600">Active</span>
               </div>
               
               <div className="space-y-5">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Base Charge (₹)</label>
                    <input 
                      type="number" 
                      name="delivery_charge"
                      value={settings.delivery_charge}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border-2 border-transparent focus:border-emerald-500 rounded-xl font-black text-slate-900 outline-none transition-all shadow-sm"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Free Shipping Above (₹)</label>
                    <input 
                      type="number" 
                      name="free_shipping_threshold"
                      value={settings.free_shipping_threshold}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border-2 border-transparent focus:border-emerald-500 rounded-xl font-black text-slate-900 outline-none transition-all shadow-sm"
                    />
                 </div>
               </div>
            </div>

            {/* Express */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                     <Truck size={18} className="text-slate-600" />
                     <h3 className="font-bold text-slate-900">Express Delivery</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="enable_express"
                      name="enable_express"
                      checked={settings.enable_express}
                      onChange={handleChange}
                      className="accent-black h-4 w-4 cursor-pointer"
                    />
                    <label htmlFor="enable_express" className="text-xs font-bold cursor-pointer select-none">Enable</label>
                  </div>
               </div>
               
               <div className={`space-y-5 transition-all duration-300 ${settings.enable_express ? 'opacity-100' : 'opacity-40 pointer-events-none blur-[1px]'}`}>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Express Charge (₹)</label>
                    <input 
                      type="number" 
                      name="express_charge"
                      value={settings.express_charge}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border-2 border-transparent focus:border-black rounded-xl font-black text-slate-900 outline-none transition-all shadow-sm"
                    />
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* 3. PAYMENT METHODS & TAX */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Tax */}
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm h-full flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-sm">
                <Percent size={24} />
              </div>
              <h2 className="text-lg font-black text-slate-900">Tax Rules</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-auto">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tax Name</label>
                 <input 
                   type="text" 
                   name="tax_name"
                   value={settings.tax_name || 'GST'}
                   onChange={handleChange}
                   className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-orange-500 rounded-xl font-bold text-slate-900 outline-none"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Rate (%)</label>
                 <input 
                   type="number" 
                   name="tax_rate"
                   value={settings.tax_rate}
                   onChange={handleChange}
                   className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-orange-500 rounded-xl font-bold text-slate-900 outline-none"
                 />
               </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm h-full">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-sm">
                <CreditCard size={24} />
              </div>
              <h2 className="text-lg font-black text-slate-900">Payment Gateways</h2>
            </div>
            
            <div className="space-y-4">
               {/* COD Toggle */}
               <div className={`flex items-center justify-between p-5 rounded-xl border-2 transition-all ${settings.enable_cod ? 'bg-purple-50/30 border-purple-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-lg ${settings.enable_cod ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-500'}`}>
                        <Banknote size={20} />
                     </div>
                     <div>
                        <p className="font-bold text-slate-900 text-sm">Cash on Delivery</p>
                        <p className="text-[10px] text-slate-500 font-medium">Pay with cash upon arrival.</p>
                     </div>
                  </div>
                  <label htmlFor="enable_cod" className="relative inline-flex items-center cursor-pointer">
                    <input id="enable_cod" type="checkbox" name="enable_cod" checked={settings.enable_cod} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
               </div>

               {/* Online Toggle */}
               <div className={`flex items-center justify-between p-5 rounded-xl border-2 transition-all ${settings.enable_online ? 'bg-emerald-50/30 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-lg ${settings.enable_online ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                        <CreditCard size={20} />
                     </div>
                     <div>
                        <p className="font-bold text-slate-900 text-sm">Online Payment</p>
                        <p className="text-[10px] text-slate-500 font-medium">UPI / Cards / NetBanking.</p>
                     </div>
                  </div>
                  <label htmlFor="enable_online" className="relative inline-flex items-center cursor-pointer">
                    <input id="enable_online" type="checkbox" name="enable_online" checked={settings.enable_online} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}