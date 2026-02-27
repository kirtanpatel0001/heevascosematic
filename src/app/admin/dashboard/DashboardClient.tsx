'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import {
  TrendingUp, TrendingDown, IndianRupee, ShoppingCart,
  Users, Calendar, MoreHorizontal, Loader2, AlertCircle, Shield
} from 'lucide-react';

interface Order {
  id: string;
  user_id?: string;
  total_amount?: number;
  status: string;
  payment_method?: string;
  shipping_address?: Record<string, unknown>;
  created_at: string;
}

interface DashboardStats {
  revenue: number;
  ordersCount: number;
  customersCount: number;
  cancelledCount: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  trend: string;
  trendDirection: 'up' | 'down';
  icon: React.ElementType;
  color: string;
}

interface Props {
  initialOrders: Order[];
}

function computeStats(orders: Order[]): DashboardStats {
  const valid = orders.filter(o => o.status !== 'Cancelled');
  const cancelled = orders.filter(o => o.status === 'Cancelled');
  const revenue = valid.reduce((s, o) => s + Math.max(0, o.total_amount || 0), 0);
  const customers = new Set(
    valid.map(o => o.user_id).filter((id): id is string => !!id)
  ).size;
  return {
    revenue,
    ordersCount: valid.length,
    customersCount: customers,
    cancelledCount: cancelled.length,
  };
}

export default function DashboardClient({ initialOrders }: Props) {
  const supabase = supabaseClient();

  const [timeRange, setTimeRange] = useState('This Month');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>(() => computeStats(initialOrders));
  const [recentOrders, setRecentOrders] = useState<Order[]>(initialOrders.slice(0, 5));

  const getStartDate = useCallback((range: string): string => {
    const now = new Date();
    switch (range) {
      case 'This Month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      case 'Last 6 Months': {
        const d = new Date(now);
        d.setMonth(now.getMonth() - 6);
        return d.toISOString();
      }
      case 'This Year':
        return new Date(now.getFullYear(), 0, 1).toISOString();
      default:
        return new Date(0).toISOString();
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select('id, user_id, total_amount, status, payment_method, shipping_address, created_at')
      .gte('created_at', getStartDate(timeRange))
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(`Failed to load orders: ${fetchError.message}`);
      setLoading(false);
      return;
    }

    const safe = orders || [];
    setStats(computeStats(safe));
    setRecentOrders(safe.slice(0, 5));
    setLoading(false);
  }, [timeRange, getStartDate, supabase]);

  // Re-fetch when time range changes (skip on first render — we have initialOrders)
  const isFirstRender = useState(true);
  useEffect(() => {
    // Only fetch on time range change, not on mount
    if (timeRange !== 'This Month') {
      fetchData();
    }
  }, [timeRange]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData, supabase]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(Math.max(0, amount));

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      Delivered: 'bg-green-100 text-green-700',
      Shipped: 'bg-blue-100 text-blue-700',
      Processing: 'bg-orange-100 text-orange-700',
      Confirmed: 'bg-cyan-100 text-cyan-700',
      Pending: 'bg-yellow-100 text-yellow-700',
      Cancelled: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const getCustomerName = (order: Order) => {
    if (order.shipping_address && typeof order.shipping_address === 'object') {
      const addr = order.shipping_address as Record<string, unknown>;
      const name = `${addr.firstName || ''} ${addr.lastName || ''}`.trim();
      return name || 'Guest Customer';
    }
    return 'Guest Customer';
  };

  return (
    <div className="space-y-8 font-sans text-slate-900 pb-20">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Dashboard Overview
            <Shield className="text-green-600" size={20} />
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Live Updates • Server Protected
          </p>
        </div>

        <div className="relative">
          <select
            value={timeRange}
            onChange={(e) => {
              setLoading(true);
              setTimeRange(e.target.value);
            }}
            className="appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black cursor-pointer shadow-sm hover:bg-slate-50 transition-colors min-w-[160px]"
          >
            <option>This Month</option>
            <option>Last 6 Months</option>
            <option>This Year</option>
          </select>
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Net Revenue"
          value={loading ? '...' : formatCurrency(stats.revenue)}
          trend="Real Earnings"
          trendDirection="up"
          icon={IndianRupee}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="Successful Orders"
          value={loading ? '...' : stats.ordersCount}
          trend="Completed"
          trendDirection="up"
          icon={ShoppingCart}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Cancelled Orders"
          value={loading ? '...' : stats.cancelledCount}
          trend="Lost Sales"
          trendDirection="down"
          icon={AlertCircle}
          color="bg-red-50 text-red-600"
        />
        <StatCard
          title="Active Customers"
          value={loading ? '...' : stats.customersCount}
          trend="Buying Users"
          trendDirection="up"
          icon={Users}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {/* RECENT ORDERS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Recent Activity ({timeRange})</h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <Loader2 className="animate-spin mb-2" size={24} />
            <p className="text-sm">Loading orders...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{getCustomerName(order)}</p>
                      </td>
                      <td className={`px-6 py-4 font-bold ${order.status === 'Cancelled' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        {order.total_amount ? formatCurrency(order.total_amount) : '₹0'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded capitalize">
                          {order.payment_method || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-black transition-colors">
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No orders found for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, trendDirection, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${trendDirection === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {trendDirection === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}
        </span>
      </div>
    </div>
  );
}