'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Plus, Trash2, ShieldCheck, User, Mail, 
  Loader2, X, Briefcase, Phone, Eye, EyeOff 
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';

// --- TYPES ---
interface Staff {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'admin' | 'employee';
  password?: string;
  created_at: string;
}

export default function StaffPage() {
  const supabase = supabaseClient();

  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [newStaff, setNewStaff] = useState({
    email: '',
    full_name: '',
    phone: '',
    password: '',
    role: 'employee' as 'admin' | 'employee'
  });

  // --- 1. FETCH STAFF ---
  const fetchStaff = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching staff:', error);
    } else {
      setStaff(data as Staff[] || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // --- 2. ADD STAFF (Original Logic) ---
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // 1. Generate a Random ID (Restores your original flow)
    const newId = crypto.randomUUID(); 
    
    // 2. Insert directly into table
    const { error } = await supabase
      .from('profiles')
      .insert([{
        id: newId,
        email: newStaff.email,
        full_name: newStaff.full_name,
        phone: newStaff.phone,
        password: newStaff.password, 
        role: newStaff.role,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      alert('Error adding staff: ' + error.message);
    } else {
      await fetchStaff();
      setIsModalOpen(false);
      setNewStaff({ email: '', full_name: '', phone: '', password: '', role: 'employee' });
    }
    setSaving(false);
  };

  // --- 3. DELETE STAFF ---
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error deleting staff');
    } else {
      setStaff(staff.filter(s => s.id !== id));
    }
  };

  // Filter
  const filteredStaff = staff.filter(s => 
    (s.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (s.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20 font-sans text-slate-900 bg-[#F8F9FC] overflow-x-hidden">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Staff Management</h1>
          <p className="text-slate-500 font-medium mt-1">Manage access roles for your team.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-lg shadow-black/20"
        >
          <Plus size={18} strokeWidth={3} /> Add Staff
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm mb-8 flex gap-2 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search staff by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none rounded-lg" 
          />
        </div>
      </div>

      {/* STAFF LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full h-64 flex items-center justify-center text-slate-400">
             <Loader2 className="animate-spin" size={32} />
           </div>
        ) : filteredStaff.length > 0 ? (
          filteredStaff.map((member) => (
            <div key={member.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
               {/* Decorative Background Blur */}
               <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${member.role === 'admin' ? 'from-purple-100 to-transparent' : 'from-blue-100 to-transparent'} rounded-bl-full opacity-50 transition-opacity group-hover:opacity-100`}></div>

               <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-lg font-black text-slate-900">
                    {member.full_name ? member.full_name[0].toUpperCase() : 'U'}
                  </div>
                  
                  {member.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">
                      <ShieldCheck size={12} /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                      <Briefcase size={12} /> Employee
                    </span>
                  )}
               </div>

               <div className="relative z-10">
                 <h3 className="text-lg font-bold text-slate-900">{member.full_name || 'Unnamed Staff'}</h3>
                 <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                        <Mail size={14} /> {member.email}
                    </div>
                    {member.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                            <Phone size={14} /> {member.phone}
                        </div>
                    )}
                 </div>
               </div>

               <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity relative z-10">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Since {new Date(member.created_at).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={() => handleDelete(member.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
               </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
               <User size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No staff members found</h3>
          </div>
        )}
      </div>

      {/* --- ADD STAFF MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
             
             {/* Header */}
             <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-slate-50">
               <div>
                 <h2 className="text-xl font-black text-slate-900">Add Team Member</h2>
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Grant dashboard access</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white rounded-full text-slate-400 hover:text-black hover:bg-slate-100 transition-colors">
                 <X size={20} />
               </button>
             </div>

             {/* Body */}
             <div className="overflow-y-auto p-8">
               <form id="staff-form" onSubmit={handleAddStaff} className="space-y-8">
                 
                 {/* Row 1 */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Full Name</label>
                       <input required type="text" value={newStaff.full_name} onChange={e => setNewStaff({...newStaff, full_name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-black rounded-xl font-bold text-slate-900 outline-none transition-all" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Phone</label>
                       <input required type="tel" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-black rounded-xl font-bold text-slate-900 outline-none transition-all" placeholder="+91..." />
                    </div>
                 </div>

                 {/* Row 2 */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email</label>
                       <input required type="email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-black rounded-xl font-bold text-slate-900 outline-none transition-all" placeholder="john@heevas.com" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Password</label>
                       <div className="relative">
                          <input required type={showPassword ? "text" : "password"} value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-black rounded-xl font-bold text-slate-900 outline-none transition-all" placeholder="••••••••" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                       </div>
                    </div>
                 </div>

                 {/* Row 3: Role */}
                 <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Access Role</label>
                     <div className="grid grid-cols-2 gap-4">
                        <div onClick={() => setNewStaff({...newStaff, role: 'admin'})} className={`cursor-pointer p-4 rounded-xl border-2 flex items-center gap-3 ${newStaff.role === 'admin' ? 'border-purple-600 bg-purple-50' : 'border-slate-100 hover:border-slate-300'}`}>
                           <ShieldCheck className={newStaff.role === 'admin' ? 'text-purple-600' : 'text-slate-300'} />
                           <div><p className="font-bold text-sm">Admin</p><p className="text-[10px] text-slate-400">Full Access</p></div>
                        </div>
                        <div onClick={() => setNewStaff({...newStaff, role: 'employee'})} className={`cursor-pointer p-4 rounded-xl border-2 flex items-center gap-3 ${newStaff.role === 'employee' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-300'}`}>
                           <Briefcase className={newStaff.role === 'employee' ? 'text-blue-600' : 'text-slate-300'} />
                           <div><p className="font-bold text-sm">Employee</p><p className="text-[10px] text-slate-400">Restricted</p></div>
                        </div>
                     </div>
                 </div>

               </form>
             </div>

             <div className="px-8 py-6 border-t border-slate-100 bg-slate-50">
                <button 
                  type="submit" 
                  form="staff-form" 
                  disabled={saving} 
                  className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-black/10 text-sm tracking-wide uppercase"
                >
                   {saving ? <Loader2 className="animate-spin" size={18} /> : 'Create Account'}
                </button>
             </div>

          </div>
        </div>
      )}

    </div>
  );
}