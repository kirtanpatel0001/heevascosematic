'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import { 
  Search, 
  Trash2, 
  Loader2, 
  User, 
  ShieldCheck, 
  Eye,
  X,
  MapPin,
  Ban,
  Unlock,
  Mail,
  Phone,
  AlertCircle
} from 'lucide-react';

// --- TYPES (Matches your Images) ---
interface Address {
  id: string;
  user_id: string;
  label: string | null;  // e.g. "Home", "Work"
  street: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  is_default: boolean;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  is_blocked?: boolean; 
  addresses?: Address[]; // We now get a list of addresses
}

export default function CustomersPage() {
  const supabase = supabaseClient();
  const router = useRouter();
  
  // Data State
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // --- 1. FETCH USERS ---
  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Fetches profile AND joins the addresses table
    const { data, error } = await supabase
      .from('profiles')
      .select('*, addresses(*)') 
      .order('created_at', { ascending: false });

    if (error) {
      console.error('SUPABASE ERROR:', error);
      setErrorMsg(error.message);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- 2. ACTIONS ---
  const handleDelete = async (id: string) => {
    if (!confirm('WARNING: This will delete the user and their data. Are you sure?')) return;
    
    setActionLoading(true);
    const { error } = await supabase.from('profiles').delete().eq('id', id);

    if (error) {
      alert('Delete Failed: ' + error.message);
    } else {
      setUsers(prev => prev.filter(user => user.id !== id));
      setIsModalOpen(false);
      setSelectedUser(null);
    }
    setActionLoading(false);
  };

  const handleToggleBlock = async (user: Profile) => {
    const newStatus = !user.is_blocked;
    if (!confirm(`Are you sure you want to ${newStatus ? 'BLOCK' : 'UNBLOCK'} this user?`)) return;

    setActionLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: newStatus })
      .eq('id', user.id);

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, is_blocked: newStatus } : u
      );
      setUsers(updatedUsers);
      
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, is_blocked: newStatus });
      }
    }
    setActionLoading(false);
  };

  const openModal = (user: Profile) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // --- HELPERS ---
  const getDisplayName = (user: Profile) => {
    if (user.full_name && user.full_name.trim() !== '') return user.full_name;
    if (user.email) return user.email.split('@')[0];
    return 'User'; 
  };

  // Logic: Get default address, or the first one available
  const getPrimaryAddress = (user: Profile | null) => {
    if (!user || !user.addresses || user.addresses.length === 0) return null;
    return user.addresses.find(addr => addr.is_default) || user.addresses[0];
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const name = getDisplayName(user).toLowerCase();
    const email = (user.email || '').toLowerCase();
    return name.includes(searchLower) || email.includes(searchLower);
  });

  return (
    <div className="min-h-screen pb-10 font-sans text-slate-900 bg-[#F8F9FC]">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-slate-500 text-sm mt-1">
            Total Users: <span className="font-bold text-slate-900">{users.length}</span>
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm mb-6 max-w-md">
        <div className="relative flex items-center">
          <Search className="absolute left-3 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-transparent text-sm font-medium outline-none text-slate-900 placeholder:text-slate-400" 
          />
        </div>
      </div>

      {/* ERROR DISPLAY */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-bold text-sm">Error Fetching Data</p>
            <p className="text-xs mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p className="text-sm">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${user.is_blocked ? 'bg-red-50/50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${user.is_blocked ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
                            {user.is_blocked ? <Ban size={16} /> : <User size={16} />}
                          </div>
                          <span className={`text-sm font-bold capitalize ${user.is_blocked ? 'text-red-700' : 'text-slate-900'}`}>
                            {getDisplayName(user)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex flex-col">
                          <span>{user.email}</span>
                          {user.phone && <span className="text-xs text-slate-400">{user.phone}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
                            <ShieldCheck size={12} /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            Customer
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.is_blocked ? (
                          <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700 border border-red-200">
                            Blocked
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           <button 
                              onClick={() => handleToggleBlock(user)}
                              className={`p-2 rounded transition-colors border ${
                                user.is_blocked 
                                ? 'text-emerald-600 border-emerald-200 hover:bg-emerald-50' 
                                : 'text-amber-500 border-amber-200 hover:bg-amber-50'
                              }`}
                              title={user.is_blocked ? "Unblock User" : "Block User"}
                           >
                              {user.is_blocked ? <Unlock size={16} /> : <Ban size={16} />}
                           </button>

                           <button 
                              onClick={() => handleDelete(user.id)}
                              className="p-2 text-red-600 border border-red-200 hover:bg-red-50 rounded transition-colors"
                              title="Delete User"
                           >
                              <Trash2 size={16} />
                           </button>

                           <button 
                              onClick={() => openModal(user)}
                              className="p-2 text-slate-400 border border-slate-200 hover:text-black hover:bg-slate-50 rounded transition-colors"
                              title="View Details"
                           >
                              <Eye size={16} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      {errorMsg ? 'Error loading data.' : 'No customers found matching your search.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- DETAIL MODAL (Design Preserved, Data Connected) --- */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className={`flex-none px-6 py-4 border-b flex justify-between items-center ${selectedUser.is_blocked ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-full ${selectedUser.is_blocked ? 'bg-red-100 text-red-600' : 'bg-white text-slate-900 border border-slate-200'}`}>
                    {selectedUser.is_blocked ? <Ban size={20} /> : <User size={20} />}
                 </div>
                 <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Customer Details</h2>
                    <p className={`text-xs font-bold uppercase tracking-wider ${selectedUser.is_blocked ? 'text-red-600' : 'text-emerald-600'}`}>
                       {selectedUser.is_blocked ? 'Account Blocked' : 'Active Account'}
                    </p>
                 </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white rounded-full text-slate-400 hover:text-black hover:bg-slate-200 transition-colors shadow-sm">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               
               {/* 1. Personal Info */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                     <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Basic Info</h3>
                     
                     <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500">Full Name</label>
                        <p className="text-sm font-bold text-slate-900">{getDisplayName(selectedUser)}</p>
                     </div>
                     
                     <div className="flex items-start gap-3">
                        <Mail size={16} className="text-slate-400 mt-0.5" />
                        <div>
                           <label className="text-[10px] font-bold uppercase text-slate-500">Email Address</label>
                           <p className="text-sm font-medium text-slate-900">{selectedUser.email}</p>
                        </div>
                     </div>

                     <div className="flex items-start gap-3">
                        <Phone size={16} className="text-slate-400 mt-0.5" />
                        <div>
                           <label className="text-[10px] font-bold uppercase text-slate-500">Phone Number</label>
                           <p className="text-sm font-medium text-slate-900">{selectedUser.phone || 'N/A'}</p>
                        </div>
                     </div>
                  </div>

                  {/* 2. Address Info (Using New Table Structure) */}
                  <div className="space-y-4">
                     <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Default Address</h3>
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 h-full">
                        {/* Check if address exists */}
                        {getPrimaryAddress(selectedUser) ? (
                           <>
                             <div className="flex items-start gap-2 mb-2">
                                <MapPin size={18} className="text-slate-400 shrink-0" />
                                <div className="flex items-center gap-2">
                                  <label className="text-[10px] font-bold uppercase text-slate-500 pt-0.5">Shipping Location</label>
                                  {getPrimaryAddress(selectedUser)?.label && (
                                     <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">
                                       {getPrimaryAddress(selectedUser)?.label}
                                     </span>
                                  )}
                                </div>
                             </div>
                             
                             <div className="text-sm font-medium text-slate-700 leading-relaxed ml-6">
                                <div className="mt-1">
                                  {getPrimaryAddress(selectedUser)?.street}<br/>
                                  {getPrimaryAddress(selectedUser)?.city}, {getPrimaryAddress(selectedUser)?.state}
                                  <br/>
                                  <span className="font-bold text-slate-900">
                                     {getPrimaryAddress(selectedUser)?.pincode}
                                  </span>
                                </div>
                             </div>
                           </>
                        ) : (
                           <div className="flex flex-col items-center justify-center h-full text-slate-400 py-4">
                              <MapPin size={24} className="mb-2 opacity-50" />
                              <span className="text-sm italic">No address found</span>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               <div className="h-px bg-slate-100 w-full my-4" />

               {/* 3. Admin Actions */}
               <div>
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">Admin Actions</h3>
                  <div className="flex gap-4">
                     
                     <button 
                        onClick={() => handleToggleBlock(selectedUser)}
                        disabled={actionLoading}
                        className={`flex-1 py-3 border-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                           selectedUser.is_blocked 
                           ? 'border-emerald-100 text-emerald-600 hover:bg-emerald-50' 
                           : 'border-amber-100 text-amber-600 hover:bg-amber-50'
                        }`}
                     >
                        {actionLoading ? <Loader2 className="animate-spin" size={16} /> : (selectedUser.is_blocked ? <Unlock size={16} /> : <Ban size={16} />)}
                        {selectedUser.is_blocked ? 'Unblock Access' : 'Block Access'}
                     </button>

                     <button 
                        onClick={() => handleDelete(selectedUser.id)}
                        disabled={actionLoading}
                        className="flex-1 py-3 bg-white border-2 border-red-100 text-red-600 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
                     >
                        {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                        Delete User
                     </button>
                  </div>
               </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}