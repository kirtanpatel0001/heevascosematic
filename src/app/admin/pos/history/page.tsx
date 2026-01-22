export const runtime = 'nodejs';

import { supabaseServer } from '@/lib/supabaseServer';
import { formatDate } from '@/lib/utils'; // Assuming you have a utils file, or use native Date
import { BadgeCheck, Banknote, CreditCard, Calendar } from 'lucide-react';

export default async function POSHistoryPage() {
  const supabase = await supabaseServer();

  // Fetch orders where shipping_address contains type: 'POS_OFFLINE'
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    // JSONB Filter: Only show POS orders
    .contains('shipping_address', { type: 'POS_OFFLINE' });

  if (error) {
    return <div className="text-red-500">Error loading history: {error.message}</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100 bg-gray-50/50">
        <h2 className="font-bold text-gray-800">Offline Transaction History</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3">Order ID</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Method</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((order) => {
              // Extract customer name safely from JSONB
              const customerName = (order.shipping_address as any)?.full_name || 'Walk-in';
              
              return (
                <tr key={order.id} className="bg-white border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400"/>
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {customerName}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 px-2 py-1 rounded border border-gray-200 w-fit text-xs font-medium text-gray-600 bg-gray-50">
                      {order.payment_method === 'CASH' ? <Banknote size={12}/> : <CreditCard size={12}/>}
                      {order.payment_method}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    ₹{order.total_amount}
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium w-fit border border-green-100">
                      <BadgeCheck size={12} />
                      Paid
                    </span>
                  </td>
                </tr>
              );
            })}
            
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  No offline orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}