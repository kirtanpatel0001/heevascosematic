'use client';

import { useState } from 'react';
import {
  Search, Plus, Trash2, ShieldCheck, User, Mail,
  Loader2, X, Briefcase, Phone, Eye, EyeOff
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';

interface Staff {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'admin' | 'employee';
  created_at: string;
}

interface Props {
  initialStaff: Staff[];
}

export default function StaffClient({ initialStaff }: Props) {
  const supabase = supabaseClient();

  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [newStaff, setNewStaff] = useState({
    email: '',
    full_name: '',
    phone: '',
    password: '',
    role: 'employee' as 'admin' | 'employee',
  });

  const fetchStaff = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, created_at')
      .in('role', ['admin', 'employee'])
      .order('created_at', { ascending: false });
    if (data) setStaff(data as Staff[]);
  };

  // ✅ Uses server API route to properly create Supabase Auth user
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    if (newStaff.password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/staff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff),
      });
      const result = await res.json();
      if (!res.ok) {
        setFormError(result.error || 'Failed to create staff member.');
      } else {
        await fetchStaff();
        setIsModalOpen(false);
        setNewStaff({ email: '', full_name: '', phone: '', password: '', role: 'employee' });
      }
    } catch {
      setFormError('Network error. Please try again.');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this staff member? They will lose dashboard access.')) return;

    try {
      const res = await fetch(`/api/admin/staff/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id }),
      });
      if (res.ok) {
        setStaff(prev => prev.filter(s => s.id !== id));
      } else {
        const result = await res.json();
        alert('Error: ' + result.error);
      }
    } catch {
      alert('Network error. Please try again.');
    }
  };

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
          onClick={() => { setIsModalOpen(true); setFormError(null); }}
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

      {/* STAFF GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.length > 0 ? filteredStaff.map(member => (
          <div key={member.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${member.role === 'admin' ? 'from-purple-100 to-transparent' : 'from-blue-100 to-transparent'} rounded-bl-full opacity-50 transition-opacity group-hover:opacity-100`} />

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

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center relative z-10">
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
        )) : (
          <div className="col-span-full py-20 text-center">
            <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
              <User size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No staff members found</h3>
            <p className="text-slate-500 text-sm mt-1">Add your first team member to get started.</p>
          </div>
        )}
      </div>

      {/* ADD STAFF MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-slate-50">
              <div>
                <h2 className="text-xl font-black text-slate-900">Add Team Member</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Grant dashboard access</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white rounded-full text-slate-400 hover:text-black hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-8">
              {formError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                  {formError}
                </div>
              )}
              <form id="staff-form" onSubmit={handleAddStaff} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Full Name *</label>
                    <input
                      required type="text" value={newStaff.full_name}
                      onChange={e => setNewStaff({ ...newStaff, full_name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-black rounded-xl font-bold text-slate-900 outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Phone *</label>
                    <input
                      required type="tel" value={newStaff.phone}
                      onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-black rounded-xl font-bold text-slate-900 outline-none transition-all"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email *</label>
                    <input
                      required type="email" value={newStaff.email}
                      onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-black rounded-xl font-bold text-slate-900 outline-none transition-all"
                      placeholder="john@store.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Password * (min 8 chars)</label>
                    <div className="relative">
                      <input
                        required type={showPassword ? 'text' : 'password'} value={newStaff.password}
                        onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-black rounded-xl font-bold text-slate-900 outline-none transition-all pr-12"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Access Role</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { role: 'admin' as const, label: 'Admin', desc: 'Full Access', color: 'border-purple-600 bg-purple-50', Icon: ShieldCheck, iconColor: 'text-purple-600' },
                      { role: 'employee' as const, label: 'Employee', desc: 'Restricted', color: 'border-blue-600 bg-blue-50', Icon: Briefcase, iconColor: 'text-blue-600' },
                    ].map(item => (
                      <div
                        key={item.role}
                        onClick={() => setNewStaff({ ...newStaff, role: item.role })}
                        className={`cursor-pointer p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${newStaff.role === item.role ? item.color : 'border-slate-100 hover:border-slate-300'}`}
                      >
                        <item.Icon className={newStaff.role === item.role ? item.iconColor : 'text-slate-300'} size={20} />
                        <div>
                          <p className="font-bold text-sm">{item.label}</p>
                          <p className="text-[10px] text-slate-400">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50">
              <button
                type="submit"
                form="staff-form"
                disabled={saving}
                className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 shadow-lg text-sm tracking-wide uppercase"
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