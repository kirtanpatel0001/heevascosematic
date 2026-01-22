'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import { 
  User, MapPin, Shield, LogOut, Trash2, Plus, 
  Loader2, CheckCircle2, AlertCircle, Home, 
  ArrowLeft, Pencil, ChevronRight, Briefcase 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* =======================
   TYPES
======================= */
interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

interface Address {
  id: string;
  label: string;
  house_no?: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

/* =======================
   COMPONENTS
======================= */

// 1. Toast Notification
function Toast({ show, message, type }: ToastState & { onClose: () => void }) {
  if (!show) return null;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={`fixed top-6 right-6 z-[60] flex items-center gap-3 px-5 py-3 rounded-lg shadow-xl border ${
        type === 'success' ? 'bg-gray-900 text-white border-gray-900' : 'bg-red-50 text-red-600 border-red-200'
      }`}
    >
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span className="font-medium text-sm">{message}</span>
    </motion.div>
  );
}

// 2. Input Field
function Input({ label, disabled, ...props }: { label: string; disabled?: boolean; [key: string]: any }) {
  return (
    <div className="space-y-1.5 w-full">
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      <input
        disabled={disabled}
        {...props}
        className={`w-full border rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200
          ${disabled 
            ? 'bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed' 
            : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900 focus:ring-1 focus:ring-gray-900'
          } outline-none placeholder:text-gray-400`}
      />
    </div>
  );
}

// 3. Skeleton
function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-8 w-full">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 bg-gray-100 rounded-full"></div>
        <div className="space-y-2">
          <div className="h-4 w-40 bg-gray-100 rounded"></div>
          <div className="h-3 w-60 bg-gray-100 rounded"></div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-10 w-full bg-gray-100 rounded"></div>
        <div className="h-10 w-full bg-gray-100 rounded"></div>
      </div>
    </div>
  );
}

/* =======================
   MAIN PAGE
======================= */
export default function ProfilePage() {
  const supabase = supabaseClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'address' | 'security'>('profile');
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });

  // Data States
  const [profile, setProfile] = useState<UserProfile>({ id: '', full_name: '', email: '', phone: '' });
  const [addresses, setAddresses] = useState<Address[]>([]);
  
  // Address Form States
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false); 
  
  // UPDATED ADDRESS FORM STATE
  const [addressForm, setAddressForm] = useState({
    labelType: 'Home', 
    customLabel: '',
    houseNo: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  /* --- FETCH DATA --- */
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: addressData } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at');

      setProfile({
        id: user.id,
        full_name: profileData?.full_name ?? '',
        email: user.email ?? '',
        phone: profileData?.phone ?? '',
      });

      setAddresses(addressData ?? []);
      setLoading(false);
    };
    load();
  }, [router, supabase]);

  /* --- HANDLERS --- */
  const updateProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profile.full_name, phone: profile.phone })
      .eq('id', profile.id);

    setSaving(false);
    if (error) showToast('Failed to update profile', 'error');
    else showToast('Profile details updated', 'success');
  };

  const updatePassword = async () => {
    if (password.length < 6) return showToast('Password must be at least 6 characters', 'error');
    if (password !== confirmPassword) return showToast('Passwords do not match', 'error');

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) showToast(error.message, 'error');
    else {
      showToast('Password changed successfully', 'success');
      setPassword(''); setConfirmPassword('');
    }
  };

  // Address Logic
  const handleEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    
    let lType = 'Other';
    let cLabel = addr.label;
    if (addr.label === 'Home') { lType = 'Home'; cLabel = ''; }
    else if (addr.label === 'Work') { lType = 'Work'; cLabel = ''; }

    setAddressForm({
      labelType: lType,
      customLabel: cLabel,
      houseNo: addr.house_no || '',
      street: addr.street,
      landmark: addr.landmark || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode
    });
    setShowAddressForm(true);
  };

  const saveAddress = async () => {
    if (!addressForm.houseNo || !addressForm.street || !addressForm.city || !addressForm.pincode) {
        return showToast('Please fill all required fields', 'error');
    }

    setSaving(true);

    let finalLabel = addressForm.labelType;
    if (addressForm.labelType === 'Other') {
        finalLabel = addressForm.customLabel.trim();
        if (!finalLabel) {
            setSaving(false);
            return showToast("Please enter a name for this address", 'error');
        }
    }

    const payload = {
        label: finalLabel,
        house_no: addressForm.houseNo,
        street: addressForm.street,
        landmark: addressForm.landmark,
        city: addressForm.city,
        state: addressForm.state,
        pincode: addressForm.pincode
    };

    if (editingAddressId) {
      const { error } = await supabase.from('addresses').update(payload).eq('id', editingAddressId);
      if (!error) {
        setAddresses(addresses.map(a => a.id === editingAddressId ? { ...a, ...payload } : a));
        resetAddressForm();
        showToast('Address updated', 'success');
      } else {
        showToast('Update failed', 'error');
      }
    } else {
      if (addresses.length >= 2) {
        setSaving(false);
        return showToast('Maximum 2 addresses allowed', 'error');
      }
      const { data, error } = await supabase.from('addresses').insert({
          user_id: profile.id,
          ...payload,
          is_default: addresses.length === 0,
        }).select().single();
      
      if (!error && data) {
        setAddresses([...addresses, data]);
        resetAddressForm();
        showToast('Address added', 'success');
      } else {
        showToast('Failed to add address', 'error');
      }
    }
    setSaving(false);
  };

  const resetAddressForm = () => {
    setAddressForm({ 
        labelType: 'Home', customLabel: '', 
        houseNo: '', street: '', landmark: '', 
        city: '', state: '', pincode: '' 
    });
    setEditingAddressId(null);
    setShowAddressForm(false);
  };

  const deleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (!error) {
      setAddresses(addresses.filter(a => a.id !== id));
      if(editingAddressId === id) resetAddressForm();
      showToast('Address removed', 'success');
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  /* --- UI --- */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-900">
      <AnimatePresence>
        <Toast {...toast} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col h-screen sticky top-0 z-10">
        <div className="p-6">
          <button 
            onClick={() => router.push('/')} 
            className="flex items-center gap-2 text-gray-500 hover:text-black font-medium text-sm mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Home
          </button>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-xs text-gray-500 mt-1">Manage your account</p>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <SidebarButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={18} />} label="Personal Details" />
          <SidebarButton active={activeTab === 'address'} onClick={() => setActiveTab('address')} icon={<MapPin size={18} />} label="Address Book" />
          <SidebarButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Shield size={18} />} label="Login & Security" />
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto overflow-x-hidden pb-28 md:pb-10">
        <div className="max-w-2xl mx-auto pt-4 md:pt-0">
          
          {/* MOBILE BACK BUTTON - Only visible on mobile */}
          <div className="md:hidden mb-6 flex items-center justify-between">
             <button 
                onClick={() => router.push('/')} 
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100"
             >
                <ArrowLeft size={16} /> Back to Home
             </button>
          </div>
          
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
               <ProfileSkeleton />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                
                {/* PROFILE TAB */}
                {activeTab === 'profile' && (
                  <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                          <User size={20} />
                        </div>
                    </div>
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-5">
                        <Input label="Full Name" value={profile.full_name} onChange={(e: any) => setProfile({ ...profile, full_name: e.target.value })} />
                        <Input label="Phone Number" value={profile.phone} onChange={(e: any) => setProfile({ ...profile, phone: e.target.value })} />
                      </div>
                      <Input label="Email Address" value={profile.email} disabled />
                      <div className="pt-4 flex justify-end">
                        <button onClick={updateProfile} disabled={saving} className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-70 flex items-center gap-2 shadow-sm">
                          {saving && <Loader2 size={16} className="animate-spin" />} Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ADDRESS TAB */}
                {activeTab === 'address' && (
                  <div className="p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-bold text-gray-900">Saved Addresses</h2>
                      {!showAddressForm && addresses.length < 2 && (
                        <button onClick={() => setShowAddressForm(true)} className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                           <Plus size={16}/> Add New
                        </button>
                      )}
                    </div>

                    {!showAddressForm ? (
                      <div className="space-y-4">
                        {addresses.map(addr => (
                          <div key={addr.id} className="group border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-all bg-gray-50/50">
                            <div className="flex items-start justify-between">
                              <div className="flex gap-4">
                                <div className="mt-1 p-2 bg-white border border-gray-200 rounded-full text-gray-700 shadow-sm">
                                  {addr.label === 'Work' ? <Briefcase size={18} /> : <Home size={18} />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                     <h3 className="font-semibold text-gray-900">{addr.label}</h3>
                                     {addr.is_default && <span className="text-[10px] bg-gray-900 text-white px-1.5 py-0.5 rounded">Default</span>}
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                    {addr.house_no}, {addr.street}<br/>
                                    {addr.city}, {addr.state} - {addr.pincode}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditAddress(addr)} className="p-2 text-gray-500 hover:text-black hover:bg-white rounded-lg transition-all"><Pencil size={16} /></button>
                                <button onClick={() => deleteAddress(addr.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"><Trash2 size={16} /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {addresses.length === 0 && (
                          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500 text-sm">No addresses saved.</p>
                            <button onClick={() => setShowAddressForm(true)} className="mt-2 text-sm font-semibold text-gray-900 underline">Add one now</button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                           <h3 className="font-semibold text-gray-900">{editingAddressId ? 'Edit Address' : 'New Address'}</h3>
                           <button onClick={resetAddressForm} className="text-xs font-medium text-gray-500 hover:text-gray-900">Cancel</button>
                        </div>
                        <div className="space-y-4">
                           <div>
                              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Save As</label>
                              <div className="flex gap-2">
                                 {['Home', 'Work', 'Other'].map(type => (
                                     <button key={type} onClick={() => setAddressForm({...addressForm, labelType: type})} className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${addressForm.labelType === type ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200'}`}>
                                        {type}
                                     </button>
                                 ))}
                              </div>
                              {addressForm.labelType === 'Other' && (
                                  <div className="mt-3"><Input label="Custom Name" value={addressForm.customLabel} onChange={(e: any) => setAddressForm({ ...addressForm, customLabel: e.target.value })} placeholder="Ex: Mom's House" /></div>
                              )}
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Input label="Flat / House No." value={addressForm.houseNo} onChange={(e: any) => setAddressForm({ ...addressForm, houseNo: e.target.value })} />
                              <Input label="Street / Colony" value={addressForm.street} onChange={(e: any) => setAddressForm({ ...addressForm, street: e.target.value })} />
                           </div>
                           <Input label="Landmark (Optional)" value={addressForm.landmark} onChange={(e: any) => setAddressForm({ ...addressForm, landmark: e.target.value })} />
                           <div className="grid grid-cols-2 gap-4">
                              <Input label="City" value={addressForm.city} onChange={(e: any) => setAddressForm({ ...addressForm, city: e.target.value })} />
                              <Input label="State" value={addressForm.state} onChange={(e: any) => setAddressForm({ ...addressForm, state: e.target.value })} />
                           </div>
                           <Input label="Pincode" value={addressForm.pincode} onChange={(e: any) => setAddressForm({ ...addressForm, pincode: e.target.value })} />
                        </div>
                        <div className="mt-6 flex gap-3 justify-end">
                           <button onClick={resetAddressForm} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                           <button onClick={saveAddress} disabled={saving} className="bg-black text-white px-6 py-2 text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm">
                             {editingAddressId ? 'Update Address' : 'Save Address'}
                           </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* SECURITY TAB */}
                {activeTab === 'security' && (
                  <div className="p-6 md:p-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Password & Security</h2>
                    <div className="max-w-md space-y-5">
                      <Input label="New Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••••" />
                      <Input label="Confirm Password" type="password" value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                      <div className="pt-2">
                        <button onClick={updatePassword} disabled={saving} className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm">
                          {saving && <Loader2 size={16} className="animate-spin" />} Update Password
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* --- FIXED BOTTOM NAVIGATION --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 px-6 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.03)] pb-safe">
         <div className="flex justify-between items-center max-w-sm mx-auto">
            <MobileBottomTab icon={<User size={18} />} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
            <MobileBottomTab icon={<MapPin size={18} />} label="Address" active={activeTab === 'address'} onClick={() => setActiveTab('address')} />
            <MobileBottomTab icon={<Shield size={18} />} label="Security" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
         </div>
      </div>
    </div>
  );
}

/* =======================
   HELPER COMPONENTS
======================= */

function MobileBottomTab({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 transition-colors duration-200 px-2
        ${active ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
    >
      <div className={`p-1.5 rounded-full transition-all duration-300 ${active ? 'bg-gray-100' : 'bg-transparent'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wide ${active ? 'opacity-100' : 'opacity-80'}`}>
        {label}
      </span>
    </button>
  );
}

function SidebarButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
        ${active 
          ? 'bg-gray-50 text-gray-900' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
    >
      <div className="flex items-center gap-3">
        <span className={`${active ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>{icon}</span>
        {label}
      </div>
      {active && <ChevronRight size={14} className="text-gray-400" />}
    </motion.button>
  );
}