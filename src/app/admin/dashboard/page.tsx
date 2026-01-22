'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  ShoppingCart, 
  Users, 
  Calendar, 
  MoreHorizontal,
  Loader2,
  AlertCircle,
  Shield
} from 'lucide-react';

/* ===============================
   TYPE DEFINITIONS
================================ */
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

/* ===============================
   MAIN DASHBOARD COMPONENT
================================ */
export default function DashboardPage() {
  const supabase = supabaseClient();
  
  const [timeRange, setTimeRange] = useState<string>('This Month');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0,
    ordersCount: 0,
    customersCount: 0,
    cancelledCount: 0
  });
  
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  /* ===============================
     SECURITY: ADMIN AUTHORIZATION CHECK
  ================================ */
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setError('Unauthorized: Please log in');
          setIsAuthorized(false);
          setAuthChecking(false);
          return;
        }

        // Check admin role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile check error:', profileError);
          setError('Failed to verify admin status');
          setIsAuthorized(false);
          setAuthChecking(false);
          return;
        }

        if (!profile || profile.role !== 'admin') {
          setError('Forbidden: Admin access required');
          setIsAuthorized(false);
          setAuthChecking(false);
          return;
        }

        setIsAuthorized(true);
        setAuthChecking(false);
      } catch (err) {
        console.error('Authorization check failed:', err);
        setError('Authorization failed');
        setIsAuthorized(false);
        setAuthChecking(false);
      }
    };

    checkAdminAccess();
  }, [supabase]);

  /* ===============================
     DATE RANGE HELPER
  ================================ */
  const getStartDate = useCallback((range: string): string => {
    const now = new Date();
    
    switch (range) {
      case 'This Month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      case 'Last 6 Months':
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        return sixMonthsAgo.toISOString();
      
      case 'This Year':
        return new Date(now.getFullYear(), 0, 1).toISOString();
      
      default:
        return new Date(0).toISOString();
    }
  }, []);

  /* ===============================
     FETCH DASHBOARD DATA
  ================================ */
  const fetchData = useCallback(async () => {
    if (!isAuthorized) return;

    const startDate = getStartDate(timeRange);

    try {
      setError(null);

      // Fetch orders with minimal fields to avoid RLS issues
      const { data: orders, error: fetchError } = await supabase
        .from('orders')
        .select('id, user_id, total_amount, status, payment_method, shipping_address, created_at')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        setError(`Failed to load orders: ${fetchError.message}`);
        setLoading(false);
        return;
      }

      if (!orders || orders.length === 0) {
        setStats({
          revenue: 0,
          ordersCount: 0,
          customersCount: 0,
          cancelledCount: 0
        });
        setRecentOrders([]);
        setLoading(false);
        return;
      }

      // Filter orders by status
      const validOrders = orders.filter((o: Order) => o.status !== 'Cancelled');
      const cancelledOrders = orders.filter((o: Order) => o.status === 'Cancelled');

      // Calculate revenue
      const totalRevenue = validOrders.reduce((sum: number, order: Order) => {
        const amount = order.total_amount || 0;
        return sum + Math.max(0, amount);
      }, 0);

      // Count unique customers
      const uniqueCustomers = new Set(
        validOrders
          .map((o: Order) => o.user_id)
          .filter((id: string | undefined): id is string => !!id)
      ).size;

      setStats({
        revenue: totalRevenue,
        ordersCount: validOrders.length,
        customersCount: uniqueCustomers,
        cancelledCount: cancelledOrders.length
      });

      setRecentOrders(orders.slice(0, 5));

    } catch (err) {
      console.error('Dashboard error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [timeRange, getStartDate, isAuthorized, supabase]);

  /* ===============================
     REALTIME SUBSCRIPTION
  ================================ */
  useEffect(() => {
    if (!isAuthorized) return;

    fetchData();

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          console.log('Realtime update detected');
          fetchData();
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, isAuthorized, supabase]);

  /* ===============================
     UTILITY FUNCTIONS
  ================================ */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Math.max(0, amount));
  };

  const getStatusColor = (status: string): string => {
    const statusMap: Record<string, string> = {
      'Delivered': 'bg-green-100 text-green-700',
      'Shipped': 'bg-blue-100 text-blue-700',
      'Processing': 'bg-orange-100 text-orange-700',
      'Confirmed': 'bg-cyan-100 text-cyan-700',
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Cancelled': 'bg-red-100 text-red-700'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-700';
  };

  const getCustomerName = (order: Order): string => {
    if (order.shipping_address && typeof order.shipping_address === 'object') {
      const firstName = (order.shipping_address as Record<string, unknown>).firstName as string || '';
      const lastName = (order.shipping_address as Record<string, unknown>).lastName as string || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || 'Guest Customer';
    }
    return 'Guest Customer';
  };

  const getCustomerEmail = (order: Order): string => {
    if (order.shipping_address && typeof order.shipping_address === 'object') {
      const email = (order.shipping_address as Record<string, unknown>).email as string;
      if (email) return email;
    }
    return 'N/A';
  };

  /* ===============================
     LOADING & ERROR STATES
  ================================ */
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-slate-400" size={48} />
          <p className="text-slate-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-4">
            {error || 'You do not have permission to access this dashboard.'}
          </p>
          <div className="space-y-2 text-sm text-slate-500 mb-4">
            <p>Make sure you have:</p>
            <ul className="list-disc list-inside text-left">
              <li>Signed up for an account</li>
              <li>Run Step 11 (Make yourself admin)</li>
              <li>Updated the email in Step 11 to yours</li>
            </ul>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  /* ===============================
     MAIN DASHBOARD UI
  ================================ */
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
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live Updates • RLS Protected
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

      {/* ERROR DISPLAY */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <div className="flex-1">
            <p className="font-medium">{error}</p>
            <p className="text-sm mt-1">Check browser console for details</p>
          </div>
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

      {/* RECENT ORDERS TABLE */}
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
                        <div>
                          <p className="font-medium text-slate-900">{getCustomerName(order)}</p>
                          <p className="text-xs text-slate-500">{getCustomerEmail(order)}</p>
                        </div>
                      </td>
                      <td className={`px-6 py-4 font-bold ${
                        order.status === 'Cancelled' ? 'text-slate-400 line-through' : 'text-slate-900'
                      }`}>
                        {order.total_amount ? formatCurrency(order.total_amount) : '₹0'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
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

/* ===============================
   STAT CARD COMPONENT
================================ */
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
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${
          trendDirection === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {trendDirection === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}
        </span>
      </div>
    </div>
  );
}