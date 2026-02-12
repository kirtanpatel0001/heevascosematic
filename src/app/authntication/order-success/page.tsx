'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic'; // <--- ADDED THIS
import { 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  ShoppingBag,
  Download,
  MapPin,
  Mail,
  Phone,
  Store
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';

// --- DYNAMICALLY IMPORT PDF TOOLS (Prevents Server Crash) ---
const InvoicePDF = dynamic(() => import('@/components/InvoicePDF'), { ssr: false });
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <p className="text-xs text-white">Loading PDF...</p> }
);

/* ---------------- TYPES ---------------- */
interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    category: string;
  };
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  state?: string;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  shipping_address: ShippingAddress;
  items: OrderItem[];
}

interface StoreSettings {
  store_name: string;
  support_email: string;
  support_phone: string;
  currency: string;
  tax_name: string;
  tax_rate: number;
  delivery_charge: number;
  free_shipping_threshold: number;
}

/* ---------------- ORDER SUCCESS CONTENT ---------------- */
function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const supabase = supabaseClient();

  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false); 

  useEffect(() => {
    setIsClient(true);
    if (!orderId) return;

    const fetchData = async () => {
      try {
        // 1. Fetch Store Settings
        const { data: settingsData } = await supabase
          .from('store_settings')
          .select('*')
          .eq('id', 1)
          .single();
        
        if (settingsData) setSettings(settingsData);

        // 2. Fetch Order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;

        // 3. Fetch Items
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select(`*, product:products (name, category)`)
          .eq('order_id', orderId);

        if (itemsError) throw itemsError;

        setOrder({ ...orderData, items });
      } catch (err) {
        console.error(err);
        setError('Order details could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId, supabase]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" size={40} /></div>;

  if (error || !order || !settings) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center gap-4">
        <AlertCircle size={48} className="text-red-500" />
        <h2 className="text-2xl font-bold">Order Not Found</h2>
        <Link href="/shop" className="text-blue-600 hover:underline">Return to Shop</Link>
      </div>
    );
  }

  // --- CALCULATION LOGIC ---
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxAmount = (subtotal * settings.tax_rate) / 100;

  // Shipping Logic
  let shippingCost = settings.delivery_charge;
  if (settings.free_shipping_threshold > 0 && subtotal >= settings.free_shipping_threshold) {
      shippingCost = 0;
  }

  const grandTotal = subtotal + taxAmount + shippingCost;

  const calculations = {
      subtotal,
      tax: taxAmount,
      shipping: shippingCost,
      grandTotal
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 md:px-6 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        
        {/* SUCCESS BANNER */}
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 rounded-full mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Order Confirmed!</h1>
          <p className="text-slate-500 max-w-lg mx-auto font-medium">
            Thank you for buying from <span className="text-slate-900 font-bold">{settings.store_name}</span>. A confirmation has been sent to your email.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400">
              <span>Order ID:</span>
              <span className="font-mono text-slate-700 bg-gray-100 px-2 py-1 rounded font-bold">#{order.id.slice(0,8)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: ORDER SUMMARY */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag size={18} /> Order Items
                </h3>
                <span className="text-sm text-gray-500 font-medium">{order.items.length} Items</span>
              </div>
              
              <div className="p-6">
                 {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0 last:pb-0">
                       <div>
                          <p className="font-bold text-slate-900">{item.product.name}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{item.product.category}</p>
                       </div>
                       <div className="text-right">
                          <p className="font-bold text-slate-900">{settings.currency} {(item.price * item.quantity).toFixed(2)}</p>
                          <p className="text-xs text-gray-500 font-medium">Qty: {item.quantity}</p>
                       </div>
                    </div>
                 ))}

                 {/* PRICE BREAKDOWN */}
                 <div className="mt-6 pt-6 border-t border-gray-100 space-y-2">
                    <div className="flex justify-between text-gray-600 text-sm">
                       <span>Subtotal</span>
                       <span>{settings.currency} {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 text-sm">
                       <span>{settings.tax_name} ({settings.tax_rate}%)</span>
                       <span>{settings.currency} {taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 text-sm">
                       <span>Shipping Charges</span>
                       {shippingCost === 0 ? (
                           <span className="text-emerald-600 font-bold">Free</span>
                       ) : (
                           <span>{settings.currency} {shippingCost.toFixed(2)}</span>
                       )}
                    </div>
                    
                    <div className="flex justify-between text-xl font-black text-slate-900 pt-4 border-t border-gray-100 mt-4">
                       <span>Total Paid</span>
                       <span>{settings.currency} {grandTotal.toFixed(2)}</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ACTIONS & INFO */}
          <div className="space-y-6">
            
            {/* Download Card */}
            <div className="bg-slate-900 text-white rounded-xl p-6 shadow-lg">
                <h3 className="font-bold text-lg mb-2">Invoice Ready</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Download your official tax invoice containing all store and order details.
                </p>
                
                {isClient && (
                  <PDFDownloadLink
                    document={<InvoicePDF order={order} settings={settings} calculations={calculations} />}
                    fileName={`invoice-${order.id.slice(0,6)}.pdf`}
                    className="w-full block"
                  >
                    {/* @ts-ignore */}
                    {({ loading }: any) => (
                      <button 
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 rounded-lg font-bold hover:bg-gray-200 transition"
                      >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                        {loading ? 'Generating...' : 'Download Invoice'}
                      </button>
                    )}
                  </PDFDownloadLink>
                )}
            </div>

            {/* Address Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
                
                {/* Shipping To */}
                <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3 text-sm uppercase tracking-wider">
                      <MapPin size={16} /> Shipping To
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1 pl-6 border-l-2 border-gray-100">
                       <p className="font-bold text-slate-900">
                         {order.shipping_address.firstName} {order.shipping_address.lastName}
                       </p>
                       <p>{order.shipping_address.address}</p>
                       <p>{order.shipping_address.city} - {order.shipping_address.pincode}</p>
                       <p className="text-xs font-bold text-gray-400 mt-1">{order.shipping_address.phone}</p>
                    </div>
                </div>

                <div className="h-px bg-gray-50 w-full" />

                {/* Sold By (Store Info) */}
                <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3 text-sm uppercase tracking-wider">
                      <Store size={16} /> Sold By
                    </h3>
                    <div className="text-sm text-gray-600 space-y-2 pl-6 border-l-2 border-gray-100">
                       <p className="font-bold text-slate-900">{settings.store_name}</p>
                       <div className="flex items-center gap-2 text-xs">
                          <Mail size={12} /> {settings.support_email}
                       </div>
                       <div className="flex items-center gap-2 text-xs">
                          <Phone size={12} /> {settings.support_phone}
                       </div>
                    </div>
                </div>

            </div>

            <Link href="/authntication/shop" className="flex items-center justify-center gap-2 text-gray-500 hover:text-black transition py-2 font-bold text-sm">
               Continue Shopping <ArrowRight size={16} />
            </Link>

          </div>
        </div>
      </div>
    </main>
  );
}

/* ---------------- MAIN EXPORT ---------------- */
export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-slate-400" size={40} />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}