'use client';
import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { Loader2, Plus, Trash2, Ticket } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCoupons() {
  const supabase = supabaseClient();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch Coupons
  const fetchCoupons = async () => {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (data) setCoupons(data);
  };

  useEffect(() => { fetchCoupons(); }, []);

  // Generate Random 6-Digit Code
  const generateCoupon = async () => {
    setLoading(true);
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase(); // Ex: "X7K9P2"
    
    const { error } = await supabase.from('coupons').insert([{
      code: randomCode,
      discount_percent: 20, // Fixed 20% as you asked
      usage_limit: 50 // Default limit
    }]);

    if (error) toast.error("Failed to create coupon");
    else {
      toast.success(`Coupon ${randomCode} Created!`);
      fetchCoupons();
    }
    setLoading(false);
  };

  const deleteCoupon = async (id: string) => {
    if(!confirm("Delete this coupon?")) return;
    await supabase.from('coupons').delete().eq('id', id);
    fetchCoupons();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Ticket /> Coupon Manager</h1>
        <button 
          onClick={generateCoupon} 
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-zinc-800"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
          Generate 20% Code
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-bold">Code</th>
              <th className="p-4 font-bold">Discount</th>
              <th className="p-4 font-bold">Used / Limit</th>
              <th className="p-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4 font-mono font-bold text-blue-600">{c.code}</td>
                <td className="p-4">{c.discount_percent}% OFF</td>
                <td className="p-4">
                  <span className={c.used_count >= c.usage_limit ? "text-red-500 font-bold" : "text-green-600"}>
                    {c.used_count} / {c.usage_limit}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => deleteCoupon(c.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && <p className="p-8 text-center text-gray-400">No coupons active.</p>}
      </div>
    </div>
  );
}