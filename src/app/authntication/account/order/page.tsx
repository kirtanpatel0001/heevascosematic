'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Package, 
  Loader2, 
  MapPin, 
  X, 
  Download, 
  Clock,
  CheckCircle2,
  Truck,
  Ban,
  ChevronRight,
  CreditCard,
  Phone,
  ShoppingBag
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFDownloadLink 
} from '@react-pdf/renderer';

/* ---------------- TYPES ---------------- */
interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    category: string;
    image_url?: string;
  };
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_method: string;
  shipping_address: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    pincode: string;
    phone: string;
  };
  items: OrderItem[];
}

interface StoreSettings {
  store_name: string;
  support_email: string;
  support_phone: string;
  currency: string;
  delivery_charge: number;
  free_shipping_threshold: number;
}

/* ---------------- PDF STYLES ---------------- */
const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 20 },
  logoText: { fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginTop: 15 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f9fafb', padding: 8, marginTop: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  colProd: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1, textAlign: 'right' },
  totalSection: { marginTop: 20, alignItems: 'flex-end' },
});

/* ---------------- PDF COMPONENT ---------------- */
const InvoicePDF = ({ order, settings }: { order: Order, settings: StoreSettings }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <View>
          <Text style={pdfStyles.logoText}>{settings.store_name}</Text>
          <Text style={{fontSize: 9, color: '#666', marginTop: 4}}>{settings.support_email}</Text>
        </View>
        <View style={{alignItems: 'flex-end'}}>
          <Text style={{fontSize: 16, fontWeight: 'bold'}}>INVOICE</Text>
          <Text style={{marginTop: 4}}>#{order.id.slice(0,8).toUpperCase()}</Text>
          <Text>{new Date(order.created_at).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <View style={{width: '45%'}}>
          <Text style={pdfStyles.sectionTitle}>Bill To:</Text>
          <Text>{order.shipping_address.firstName} {order.shipping_address.lastName}</Text>
          <Text>{order.shipping_address.address}</Text>
          <Text>{order.shipping_address.city} - {order.shipping_address.pincode}</Text>
          <Text>Tel: {order.shipping_address.phone}</Text>
        </View>
      </View>

      <View>
        <View style={pdfStyles.tableHeader}>
          <Text style={pdfStyles.colProd}>Item</Text>
          <Text style={pdfStyles.colQty}>Qty</Text>
          <Text style={pdfStyles.colPrice}>Total</Text>
        </View>
        {order.items.map((item, i) => (
          <View key={i} style={pdfStyles.tableRow}>
            <Text style={pdfStyles.colProd}>{item.product.name}</Text>
            <Text style={pdfStyles.colQty}>{item.quantity}</Text>
            <Text style={pdfStyles.colPrice}>{settings.currency} {item.price * item.quantity}</Text>
          </View>
        ))}
      </View>

      <View style={pdfStyles.totalSection}>
        <View style={{width: 200}}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5}}>
             <Text>Subtotal:</Text>
             <Text>{settings.currency} {order.total_amount}</Text> 
          </View>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingTop: 5, borderTopWidth: 1}}>
            <Text style={{fontWeight: 'bold'}}>Total Paid:</Text>
            <Text style={{fontWeight: 'bold'}}>{settings.currency} {order.total_amount}</Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

/* ---------------- MAIN COMPONENT ---------------- */
export default function OrdersPage() {
  const supabase = supabaseClient();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: settingsData } = await supabase.from('store_settings').select('*').single();
    if (settingsData) setSettings(settingsData);

    const { data: ordersData, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (
          quantity,
          price,
          product:products (name, category, image_url)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && ordersData) {
      setOrders(ordersData as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    setIsClient(true);
    fetchData();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    setCancelling(true);
    const { error } = await supabase
      .from('orders')
      .update({ status: 'Cancelled' })
      .eq('id', orderId);

    if (error) {
      alert('Failed to cancel order.');
    } else {
      // Refresh data to show updated status
      await fetchData(); 
      setIsModalOpen(false);
    }
    setCancelling(false);
  };

  // --- STYLING HELPERS ---
  const getStatusConfig = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'delivered') return { 
        icon: <CheckCircle2 size={14} />, 
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
    };
    if (s === 'cancelled') return { 
        icon: <Ban size={14} />, 
        className: 'bg-red-50 text-red-600 border-red-200' 
    };
    if (s === 'shipped') return { 
        icon: <Truck size={14} />, 
        className: 'bg-blue-50 text-blue-700 border-blue-200' 
    };
    return { 
        icon: <Clock size={14} />, 
        className: 'bg-amber-50 text-amber-700 border-amber-200' 
    };
  };

  // --- CHECK IF CANCELLABLE (LOGIC UPDATED) ---
  // Only "pending" orders can be cancelled. 
  // Once admin accepts (Processing, Shipped, etc.), cancellation is blocked.
  const isOrderCancellable = (status: string) => {
    const s = status.toLowerCase();
    // Only 'pending' allows cancellation. Removed 'processing'.
    return s === 'pending';
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20 font-sans text-slate-900 p-4 md:p-8">
      
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">My Orders</h1>
          <p className="text-slate-500 mt-1">Track your delivery history.</p>
        </div>

        {/* ORDER LIST */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Package size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No orders found</h3>
              <p className="text-slate-500 text-sm mt-1">Start shopping to see your orders here.</p>
            </div>
          ) : (
            orders.map((order) => {
              const { icon, className } = getStatusConfig(order.status);
              const firstItem = order.items[0];
              const otherItemsCount = order.items.length - 1;
              const cancellable = isOrderCancellable(order.status);

              return (
                <div 
                  key={order.id}
                  onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                  className="bg-white rounded-2xl border border-gray-200 p-5 cursor-pointer hover:shadow-lg transition-all duration-200 group relative overflow-hidden"
                >
                  {/* Card Header: Date & Status */}
                  <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${className}`}>
                           {icon} {order.status}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                           {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <ChevronRight className="text-slate-300 group-hover:text-black transition-colors" size={18} />
                  </div>

                  <div className="flex items-start gap-4">
                      {/* Product Image */}
                      <div className="relative w-20 h-20 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                        {firstItem?.product.image_url ? (
                           <Image 
                             src={firstItem.product.image_url} 
                             alt="Product" 
                             fill 
                             className="object-cover"
                             unoptimized 
                           />
                        ) : (
                           <ShoppingBag className="m-auto text-slate-300" size={24} />
                        )}
                        {otherItemsCount > 0 && (
                           <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold backdrop-blur-[1px]">
                             +{otherItemsCount}
                           </div>
                        )}
                      </div>

                      {/* Order Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                         <div className="mb-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                            <h3 className="text-sm font-bold text-slate-900 truncate pr-4">
                               {firstItem?.product.name} 
                               {otherItemsCount > 0 && <span className="text-slate-500 font-normal"> & {otherItemsCount} more items</span>}
                            </h3>
                         </div>
                         
                         <div className="flex items-end justify-between">
                             <p className="text-lg font-black text-slate-900">
                                 {settings?.currency || 'INR'} {order.total_amount.toLocaleString()}
                             </p>

                             {/* CANCEL BUTTON ON LIST VIEW (Mini) */}
                             {cancellable && (
                               <button
                                 onClick={(e) => {
                                   e.stopPropagation(); 
                                   handleCancelOrder(order.id);
                                 }}
                                 disabled={cancelling}
                                 className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                               >
                                 {cancelling ? <Loader2 className="animate-spin" size={14} /> : <Ban size={14} />}
                                 Cancel Order
                               </button>
                             )}
                         </div>
                      </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* --- DETAILS POPUP --- */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex-none px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-xl font-black text-slate-900">Order Details</h2>
                <div className="flex items-center gap-2 mt-1">
                   <span className="font-mono text-xs font-bold bg-slate-50 border border-gray-200 px-1.5 py-0.5 rounded text-slate-600">
                      #{selectedOrder.id.slice(0, 8).toUpperCase()}
                   </span>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-black hover:bg-slate-200 transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Product List */}
              <div className="space-y-4">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <div className="relative h-16 w-16 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                        {item.product.image_url ? (
                           <Image 
                             src={item.product.image_url} 
                             alt={item.product.name} 
                             fill 
                             className="object-cover"
                             unoptimized 
                           />
                        ) : (
                           <ShoppingBag className="m-auto text-slate-300" size={20} />
                        )}
                      </div>
                      <div className="flex-1">
                         <div className="flex justify-between items-start">
                            <div>
                               <p className="font-bold text-slate-900 text-sm line-clamp-1">{item.product.name}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{item.product.category}</p>
                            </div>
                            <p className="font-bold text-slate-900 text-sm">{(item.price * item.quantity).toLocaleString()}</p>
                         </div>
                         <p className="text-xs text-slate-500 mt-1">Qty: {item.quantity} x {item.price}</p>
                      </div>
                  </div>
                ))}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Shipping */}
                 <div>
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-2">
                       <MapPin size={14}/> Delivery Address
                    </h3>
                    <div className="text-sm text-slate-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
                       <p className="font-bold text-slate-900 mb-1">{selectedOrder.shipping_address.firstName} {selectedOrder.shipping_address.lastName}</p>
                       <p className="leading-relaxed text-slate-600">{selectedOrder.shipping_address.address}</p>
                       <p className="text-slate-600">{selectedOrder.shipping_address.city} - {selectedOrder.shipping_address.pincode}</p>
                       <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 text-xs font-bold text-slate-500">
                          <Phone size={12}/> {selectedOrder.shipping_address.phone}
                       </div>
                    </div>
                 </div>

                 {/* Payment Summary */}
                 <div>
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-2">
                       <CreditCard size={14}/> Payment Info
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                       <div className="flex justify-between text-sm text-slate-500">
                          <span>Method</span>
                          <span className="font-medium text-slate-900 uppercase">{selectedOrder.payment_method.replace('_', ' ')}</span>
                       </div>
                       <div className="h-px bg-gray-200 my-2" />
                       <div className="flex justify-between text-base font-black text-slate-900">
                          <span>Total Paid</span>
                          <span>{settings?.currency || 'INR'} {selectedOrder.total_amount.toLocaleString()}</span>
                       </div>
                    </div>
                 </div>
              </div>

            </div>

            {/* Modal Footer (Updated) */}
            <div className="flex-none p-5 border-t border-gray-100 bg-white flex flex-col gap-3">
              
              {/* 1. Cancel Button: Red Outline (Shown ONLY if status is Pending) */}
              {isOrderCancellable(selectedOrder.status) && (
                 <button 
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                    disabled={!!cancelling}
                    className="w-full py-3.5 bg-white border border-red-500 text-red-600 font-bold text-sm rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                 >
                    {cancelling ? <Loader2 className="animate-spin" size={16} /> : <Ban size={16} />}
                    Cancel Order
                 </button>
              )}

              {/* 2. Download Invoice Button: Solid Black (Always visible) */}
              {isClient && (
                <PDFDownloadLink
                  document={<InvoicePDF order={selectedOrder} settings={settings!} />}
                  fileName={`invoice-${selectedOrder.id.slice(0,6)}.pdf`}
                  className="w-full"
                >
                  {({ loading }) => (
                    <button 
                      disabled={loading}
                      className="w-full bg-black text-white py-3.5 border border-black rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md"
                    >
                      {loading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                      Download Invoice
                    </button>
                  )}
                </PDFDownloadLink>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}