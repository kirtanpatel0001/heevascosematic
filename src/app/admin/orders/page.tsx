'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Search, 
  ChevronDown, 
  Download, 
  Phone,
  Loader2,
  Eye,
  MapPin,
  CreditCard,
  Calendar,
  X,
  ImageOff,
  ChevronLeft,  // New Icon
  ChevronRight  // New Icon
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';

// --- TYPES ---
type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

interface OrderItem {
  quantity: number;
  price: number;
  product: {
    name: string;
    image_url: string | null;
    category: string;
  };
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: OrderStatus;
  payment_method: string;
  shipping_address: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
  };
  items?: OrderItem[];
}

export default function OrdersPage() {
  const supabase = supabaseClient();

  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  // Export State
  const [exporting, setExporting] = useState(false);

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Dropdown State
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // --- 1. FETCH ORDERS ---
 // --- 1. FETCH ORDERS ---
  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      // 👇 THIS LINE MAKES NEW ORDERS SHOW AT THE TOP
      .order('created_at', { ascending: false }); 

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data as any[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- 2. EXPORT CSV ---
  const handleExportCSV = () => {
    setExporting(true);
    try {
      const headers = [
        'Order ID', 'Customer Name', 'Phone', 'Address', 
        'Date', 'Total', 'Status', 'Payment Method'
      ];
      
      const rows = filteredOrders.map(order => [
        order.id,
        getCustomerName(order),
        getCustomerPhone(order),
        getFullAddress(order),
        formatDate(order.created_at),
        order.total_amount,
        order.status,
        order.payment_method,
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('CSV Export Error:', err);
    } finally {
      setExporting(false);
    }
  };

  // --- 3. VIEW DETAILS (FETCH ITEMS) ---
  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
    setItemsLoading(true);

    const { data, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        price,
        product:products (name, image_url, category)
      `)
      .eq('order_id', order.id);

    if (!error && data) {
      setSelectedOrder(prev => prev ? { ...prev, items: data as any } : null);
    }
    setItemsLoading(false);
  };

  // --- 4. UPDATE STATUS ---
  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    const previousOrders = [...orders];
    const previousSelectedOrder = selectedOrder ? { ...selectedOrder } : null;

    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    
    if (selectedOrder?.id === id) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }
    
    setOpenDropdownId(null); 

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please check your connection.');
      setOrders(previousOrders);
      if (previousSelectedOrder) {
        setSelectedOrder(previousSelectedOrder);
      }
    }
  };

  // Close dropdown logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest('.status-dropdown-container') === null) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // --- HELPERS ---
  const getCustomerName = (order: Order) => {
    if (order.shipping_address && typeof order.shipping_address === 'object') {
       return `${order.shipping_address.firstName || ''} ${order.shipping_address.lastName || ''}`;
    }
    return 'Guest Customer';
  };

  const getCustomerPhone = (order: Order) => {
    return (order.shipping_address as any)?.phone || '-';
  };

  const getFullAddress = (order: Order) => {
    if (!order.shipping_address) return 'No Address Provided';
    const { address, city, pincode } = order.shipping_address;
    return `${address}, ${city} - ${pincode}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusStyles = (status: OrderStatus) => {
    const base = "text-slate-900 border";
    switch (status) {
      case 'Delivered': return `${base} bg-emerald-50 border-emerald-200 text-emerald-900`;
      case 'Shipped': return `${base} bg-blue-50 border-blue-200 text-blue-900`;
      case 'Processing': return `${base} bg-amber-50 border-amber-200 text-amber-900`;
      case 'Cancelled': return `${base} bg-rose-50 border-rose-200 text-rose-900`;
      default: return `${base} bg-white border-slate-300`; 
    }
  };

  // --- FILTERING & PAGINATION LOGIC ---
  const filteredOrders = orders.filter((order) => {
    const name = getCustomerName(order).toLowerCase();
    const id = order.id.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (id.includes(query) || name.includes(query)) && 
           (statusFilter === 'All' || order.status === statusFilter);
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Calculate Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  return (
    <div className="min-h-screen pb-10 font-sans text-slate-900 bg-[#F8F9FC] p-6 overflow-x-hidden">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Orders</h1>
          <p className="text-slate-500 font-medium mt-1">Manage customer orders and shipments.</p>
        </div>
        
        <button 
          onClick={handleExportCSV}
          disabled={exporting || filteredOrders.length === 0}
          className="w-fit bg-black text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Export CSV
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Search by ID or Customer Name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none" 
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={18} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 p-2 border-l border-slate-100 pl-4">
          {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                statusFilter === status 
                  ? 'bg-black text-white border-black shadow-md' 
                  : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-50 hover:text-black'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-visible min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 size={32} className="animate-spin mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider">Loading orders...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto flex-1"> 
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Order ID</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Customer</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Total</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentOrders.length > 0 ? (
                    currentOrders.map((order) => (
                      <tr 
                        key={order.id} 
                        className={`group hover:bg-slate-50/50 transition-colors relative ${openDropdownId === order.id ? 'z-50' : 'z-0'}`}
                      >
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            #{order.id.slice(0, 8)}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{getCustomerName(order)}</p>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                               <Phone size={10} /> {getCustomerPhone(order)}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-4 text-sm font-bold text-slate-900 whitespace-nowrap">
                          {formatPrice(order.total_amount)}
                        </td>

                        {/* Status Dropdown */}
                        <td className="px-6 py-4 relative status-dropdown-container whitespace-nowrap">
                          <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               setOpenDropdownId(openDropdownId === order.id ? null : order.id);
                             }}
                             className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all ${getStatusStyles(order.status)}`}
                          >
                             {order.status}
                             <ChevronDown size={12} strokeWidth={3} />
                          </button>

                          {openDropdownId === order.id && (
                            <div className="absolute left-6 top-full mt-2 z-50 w-40 bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                               <div className="py-1">
                                {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((s) => (
                                    <button
                                      key={s}
                                      onClick={() => handleStatusChange(order.id, s as OrderStatus)}
                                      className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center justify-between ${
                                        order.status === s ? 'bg-slate-50 text-black' : 'text-slate-500 hover:bg-slate-50 hover:text-black'
                                      }`}
                                    >
                                      {s}
                                      {order.status === s && <div className="w-1.5 h-1.5 rounded-full bg-black"></div>}
                                    </button>
                                ))}
                               </div>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right whitespace-nowrap">
                            <button 
                              onClick={() => handleViewOrder(order)}
                              className="p-2 text-slate-400 hover:text-black hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200 hover:shadow-sm"
                            >
                              <Eye size={18} />
                            </button>
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                        <p className="text-sm font-medium">No orders found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* --- PAGINATION FOOTER --- */}
            {filteredOrders.length > 0 && (
              <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50/50 rounded-b-2xl">
                <p className="text-xs font-medium text-slate-500">
                  Showing <span className="font-bold text-slate-900">{indexOfFirstItem + 1}</span> to <span className="font-bold text-slate-900">{Math.min(indexOfLastItem, filteredOrders.length)}</span> of <span className="font-bold text-slate-900">{filteredOrders.length}</span> results
                </p>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <span className="text-xs font-bold text-slate-700 px-2">
                     Page {currentPage} of {totalPages}
                  </span>

                  <button 
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* --- MODAL --- */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-slate-50">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-black text-slate-900">Order #{selectedOrder.id.slice(0, 8)}</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${getStatusStyles(selectedOrder.status)}`}>
                       {selectedOrder.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Calendar size={12} /> Placed on {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white rounded-full text-slate-400 hover:text-black hover:bg-slate-100 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                
                {/* 1. Customer & Shipping Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Customer Details</h3>
                      <div className="flex items-start gap-3">
                         <div className="p-2 bg-slate-100 rounded-lg"><Phone size={18} className="text-slate-600" /></div>
                         <div>
                            <p className="text-sm font-bold text-slate-900">{getCustomerName(selectedOrder)}</p>
                            <p className="text-xs text-slate-500">{getCustomerPhone(selectedOrder)}</p>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Shipping Address</h3>
                      <div className="flex items-start gap-3">
                         <div className="p-2 bg-slate-100 rounded-lg"><MapPin size={18} className="text-slate-600" /></div>
                         <p className="text-sm font-medium text-slate-700 leading-relaxed max-w-[200px]">
                            {getFullAddress(selectedOrder)}
                         </p>
                      </div>
                   </div>
                </div>

                <div className="h-px bg-slate-100 w-full" />

                {/* 2. Order Items */}
                <div className="space-y-4">
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Order Items</h3>
                   {itemsLoading ? (
                      <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
                   ) : (
                      <div className="space-y-3">
                         {selectedOrder.items?.map((item, index) => (
                            <div key={index} className="flex items-center gap-4 p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                               <div className="h-12 w-12 bg-white rounded-lg border border-slate-200 relative overflow-hidden flex-shrink-0">
                                  {item.product?.image_url ? (
                                    <Image 
                                      src={item.product.image_url} 
                                      alt={item.product.name} 
                                      fill 
                                      className="object-cover"
                                      unoptimized={true}
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center h-full text-slate-300">
                                      <ImageOff size={16} />
                                    </div>
                                  )}
                               </div>

                               <div className="flex-1">
                                  <p className="text-sm font-bold text-slate-900">{item.product?.name}</p>
                                  <p className="text-xs text-slate-500">{item.product?.category}</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-xs text-slate-500 mb-0.5">Qty: {item.quantity}</p>
                                  <p className="text-sm font-bold text-slate-900">{formatPrice(item.price)}</p>
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
                
                {/* 3. Payment Info */}
                <div className="bg-slate-900 text-white p-5 rounded-xl flex justify-between items-center shadow-lg shadow-slate-200">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-lg"><CreditCard size={20} className="text-white" /></div>
                      <div>
                         <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Payment Method</p>
                         <p className="text-sm font-bold capitalize">{selectedOrder.payment_method === 'cod' ? 'Cash on Delivery' : selectedOrder.payment_method}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Amount</p>
                      <p className="text-xl font-black">{formatPrice(selectedOrder.total_amount)}</p>
                   </div>
                </div>

             </div>

          </div>
        </div>
      )}

    </div>
  );
}