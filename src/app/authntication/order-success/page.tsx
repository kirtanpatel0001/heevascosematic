'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, ArrowRight, Loader2, AlertCircle,
  ShoppingBag, Download, MapPin, Mail, Phone, Store
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';
import { InvoicePDF } from '@/components/invoice/InvoiceTemplate';
import type { InvoiceData, StoreSettings } from '@/components/invoice/InvoiceTemplate';
import dynamic from 'next/dynamic';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => (
      <button className="w-full py-3 bg-gray-100 text-gray-400 rounded-lg font-bold text-sm">
        Loading PDF...
      </button>
    )
  }
);

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product_id: string;
  product: { name: string; category: string; image_url?: string };
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

function toInvoiceData(order: Order): InvoiceData {
  return {
    id: order.id,
    created_at: order.created_at,
    total_amount: order.total_amount,
    payment_method: order.payment_method,
    shipping_address: order.shipping_address,
    items: order.items.map((item) => ({
      name: item.product.name,
      category: item.product.category,
      quantity: item.quantity,
      price: item.price,
    })),
  };
}

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
    if (!orderId) {
      setError('No order ID provided.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // ✅ Verify user owns this order
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Please login to view this order.');
          setLoading(false);
          return;
        }

        const { data: settingsData } = await supabase
          .from('store_settings')
          .select('store_name, support_email, support_phone, currency, tax_name, tax_rate, delivery_charge, free_shipping_threshold, gst_number, address, city, pincode, website')
          .eq('id', 1)
          .single();

        if (settingsData) setSettings(settingsData);

        // ✅ Fixed: filter by user_id to prevent order peeking
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('id, created_at, total_amount, status, payment_method, shipping_address')
          .eq('id', orderId)
          .eq('user_id', user.id)
          .single();

        if (orderError || !orderData) throw new Error('Order not found or access denied.');

        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*, product:products (name, category)')
          .eq('order_id', orderId);

        if (itemsError) throw itemsError;

        setOrder({ ...orderData, items: items || [] });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Order details could not be loaded.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId, supabase]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={40} />
      </div>
    );
  }

  if (error || !order || !settings) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center gap-4 px-4">
        <AlertCircle size={48} className="text-red-500" />
        <h2 className="text-2xl font-bold">Order Not Found</h2>
        <p className="text-gray-500 text-sm">{error}</p>
        <Link href="/authntication/shop" className="text-blue-600 hover:underline text-sm">Return to Shop</Link>
      </div>
    );
  }

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
            Thank you for buying from{' '}
            <span className="text-slate-900 font-bold">{settings.store_name}</span>.
            A confirmation has been sent to your email.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400">
            <span>Order ID:</span>
            <span className="font-mono text-slate-700 bg-gray-100 px-2 py-1 rounded font-bold">
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ORDER ITEMS */}
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

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex justify-between text-xl font-black text-slate-900 pt-4 border-t border-gray-100 mt-4">
                    <span>Total Paid</span>
                    <span>{settings.currency} {order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">

            {/* INVOICE DOWNLOAD */}
            <div className="bg-slate-900 text-white rounded-xl p-6 shadow-lg">
              <h3 className="font-bold text-lg mb-2">Invoice Ready</h3>
              <p className="text-gray-400 text-sm mb-6">
                Download your official tax invoice with all order details.
              </p>
              {isClient && (
                <PDFDownloadLink
                  document={<InvoicePDF invoice={toInvoiceData(order)} settings={settings} />}
                  fileName={`INV-${order.id.slice(0, 8).toUpperCase()}.pdf`}
                  className="w-full block"
                >
                  {({ loading: pdfLoading }) => (
                    <button
                      disabled={pdfLoading}
                      className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 rounded-lg font-bold hover:bg-gray-200 transition"
                    >
                      {pdfLoading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                      {pdfLoading ? 'Generating...' : 'Download Invoice'}
                    </button>
                  )}
                </PDFDownloadLink>
              )}
            </div>

            {/* ADDRESS + STORE INFO */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
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

            {/* ✅ Fixed: consistent shop path */}
            <Link
              href="/authntication/shop"
              className="flex items-center justify-center gap-2 text-gray-500 hover:text-black transition py-2 font-bold text-sm"
            >
              Continue Shopping <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

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
