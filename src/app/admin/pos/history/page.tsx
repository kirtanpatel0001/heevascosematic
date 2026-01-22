export const runtime = 'nodejs';

import { supabaseServer } from '@/lib/supabaseServer';
import { BadgeCheck, Banknote, CreditCard, Calendar, ShoppingBag } from 'lucide-react';

export default async function POSHistoryPage() {
  const supabase = await supabaseServer();

  // 1. CHANGE: Select from 'pos_sales' instead of 'orders'
  // We don't need the filter for 'POS_OFFLINE' because this table specifically holds POS sales.
  const { data: sales, error } = await supabase
    .from('pos_sales') 
    .select('*')
    .order('created_at', { ascending: false });

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
              <th className="px-6 py-3">Transaction ID</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Items Purchased</th> {/* Added Items Column */}
              <th className="px-6 py-3">Method</th>
              <th className="px-6 py-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sales?.map((sale) => {
              // Parse items if they are stored as a JSON string, or use directly if JSONB
              const items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items;

              return (
                <tr key={sale.id} className="bg-white border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    #{sale.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400"/>
                      {new Date(sale.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{sale.customer_name || 'Walk-in'}</div>
                    <div className="text-xs text-gray-400">{sale.customer_phone}</div>
                  </td>
                  
                  {/* 2. NEW: Display the Items */}
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex flex-col gap-1">
                      {Array.isArray(items) && items.length > 0 ? (
                        items.map((item: any, index: number) => (
                          <div key={index} className="flex items-center gap-1 text-xs">
                             <ShoppingBag size={10} className="text-gray-400" />
                             <span className="font-medium">{item.name || item.product_name || 'Item'}</span>
                             <span className="text-gray-400">x{item.quantity || 1}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400 italic text-xs">No items details</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 px-2 py-1 rounded border border-gray-200 w-fit text-xs font-medium text-gray-600 bg-gray-50">
                      {sale.payment_method === 'CASH' ? <Banknote size={12}/> : <CreditCard size={12}/>}
                      {sale.payment_method}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    ₹{sale.total_amount}
                  </td>
                </tr>
              );
            })}
            
            {(!sales || sales.length === 0) && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  No pos sales found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}