'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Package, Loader2, MapPin, X, Download, Clock, CheckCircle2, 
  Truck, Ban, ChevronRight, CreditCard, Phone, ShoppingBag, 
  Star, Upload, MessageSquarePlus 
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { submitVerifiedReview } from '@/app/actions/review-actions'; 
import { toast } from "sonner"; 

/* ---------------- TYPES ---------------- */
interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product_id: string; 
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
}

/* ---------------- PDF COMPONENT ---------------- */
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
          <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingTop: 5, borderTopWidth: 1}}>
            <Text style={{fontWeight: 'bold'}}>Total Paid:</Text>
            <Text style={{fontWeight: 'bold'}}>{settings.currency} {order.total_amount}</Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

/* ---------------- REVIEW MODAL COMPONENT ---------------- */
const ReviewModal = ({ isOpen, onClose, product, orderId, onSuccess }: { isOpen: boolean, onClose: () => void, product: any, orderId: string, onSuccess: () => void }) => {
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 3 - selectedImages.length);
      setSelectedImages(prev => [...prev, ...newFiles]);
      setPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
    }
  };

  const removeImage = (idx: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    formData.append("rating", rating.toString());
    formData.append("productId", product.id); 
    formData.append("orderId", orderId);
    
    selectedImages.forEach((file, i) => formData.append(`image-${i}`, file));

    const res = await submitVerifiedReview(formData);
    
    if (res?.error) {
      toast.error("Submission Failed", {
        description: res.error,
        duration: 4000,
      });
    } else {
      toast.success("Review Posted", {
        description: "Thank you! Your feedback has been published.",
        duration: 4000,
        icon: <CheckCircle2 className="text-green-500" />
      });
      onSuccess(); // Triggers data refresh to disable button
      onClose(); 
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
           <h3 className="font-bold text-slate-800">Rate & Review</h3>
           <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div className="flex gap-4 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="relative w-14 h-14 bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
               {product.image_url && <Image src={product.image_url} alt="p" fill className="object-cover" />}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
               <p className="font-bold text-sm text-slate-900 line-clamp-1">{product.name}</p>
               <p className="text-[10px] uppercase font-bold text-slate-400">{product.category}</p>
            </div>
          </div>

          <form action={handleSubmit} className="space-y-6">
             <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block tracking-wider">Your Rating</label>
                <div className="flex gap-2">
                   {[1,2,3,4,5].map(star => (
                      <button type="button" key={star} onClick={() => setRating(star)} className="focus:outline-none hover:scale-110 transition-transform">
                         <Star size={32} fill={star <= rating ? "#EAB308" : "none"} className={star <= rating ? "text-yellow-500" : "text-gray-200"} strokeWidth={1.5} />
                      </button>
                   ))}
                </div>
             </div>

             <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block tracking-wider">Your Review</label>
                <textarea 
                  name="comment" 
                  required 
                  placeholder="How was the quality? Did it meet your expectations?" 
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm min-h-[120px] focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all placeholder:text-gray-300 resize-none"
                ></textarea>
             </div>

             <div>
                <label className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 cursor-pointer w-fit hover:text-black transition-colors mb-3">
                   <div className="p-2 bg-gray-50 rounded-lg border border-gray-200"><Upload size={14} /></div>
                   Add Photos (Max 3)
                   <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" disabled={selectedImages.length >= 3} />
                </label>
                
                {previews.length > 0 && (
                  <div className="flex gap-2">
                     {previews.map((src, i) => (
                        <div key={i} className="w-16 h-16 relative rounded-lg border border-gray-200 overflow-hidden group">
                           <Image src={src} fill alt="preview" className="object-cover" />
                           <button type="button" onClick={() => removeImage(i)} className="absolute top-0 right-0 p-1 bg-black/50 text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100">
                             <X size={10} />
                           </button>
                        </div>
                     ))}
                  </div>
                )}
             </div>

             <button 
              disabled={isSubmitting} 
              type="submit" 
              className="w-full bg-black text-white py-3.5 rounded-xl font-bold text-sm hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-black/5 flex items-center justify-center gap-2"
             >
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Submit Review"}
             </button>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ---------------- MAIN ORDERS PAGE ---------------- */
export default function OrdersPage() {
  const supabase = supabaseClient();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  
  // NEW: State to track which products the user has reviewed
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set());

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState<any>(null);
  const [activeOrderId, setActiveOrderId] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: settingsData } = await supabase.from('store_settings').select('*').single();
    if (settingsData) setSettings(settingsData);

    // 1. Fetch Orders
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (
          product_id,
          quantity,
          price,
          product:products (name, category, image_url)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 2. Fetch Existing Reviews for this user (To disable buttons)
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('product_id')
      .eq('user_id', user.id);

    if (reviewsData) {
      // Create a Set of product IDs the user has already reviewed
      const reviewedSet = new Set(reviewsData.map(r => r.product_id));
      setReviewedProductIds(reviewedSet);
    }

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
    const { error } = await supabase.from('orders').update({ status: 'Cancelled' }).eq('id', orderId);
    if (!error) { await fetchData(); setIsModalOpen(false); toast.success("Order Cancelled"); }
    else { toast.error("Failed to cancel order"); }
    setCancelling(false);
  };

  const getStatusConfig = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'delivered') return { icon: <CheckCircle2 size={14} />, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (s === 'cancelled') return { icon: <Ban size={14} />, className: 'bg-red-50 text-red-600 border-red-200' };
    if (s === 'shipped') return { icon: <Truck size={14} />, className: 'bg-blue-50 text-blue-700 border-blue-200' };
    return { icon: <Clock size={14} />, className: 'bg-amber-50 text-amber-700 border-amber-200' };
  };

  const isOrderCancellable = (status: string) => status.toLowerCase() === 'pending';

  const openReviewModal = (product: any, productId: string, orderId: string) => {
    setReviewProduct({ ...product, id: productId });
    setActiveOrderId(orderId);
    setReviewModalOpen(true);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-slate-400" size={32} /></div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20 font-sans text-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">My Orders</h1>
          <p className="text-slate-500 mt-1">Track your delivery history.</p>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
              <Package size={32} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-bold text-slate-900">No orders found</h3>
            </div>
          ) : (
            orders.map((order) => {
              const { icon, className } = getStatusConfig(order.status);
              const firstItem = order.items[0];
              const otherItemsCount = order.items.length - 1;
              const isReviewed = firstItem && reviewedProductIds.has(firstItem.product_id);

              return (
                <div key={order.id} onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }} className="bg-white rounded-2xl border border-gray-200 p-5 cursor-pointer hover:shadow-lg transition-all duration-200 group relative">
                  
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${className}`}>
                           {icon} {order.status}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                           {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <ChevronRight className="text-slate-300 group-hover:text-black transition-colors" size={18} />
                  </div>

                  {/* Card Body */}
                  <div className="flex items-start gap-4">
                      <div className="relative w-20 h-20 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                        {firstItem?.product.image_url ? (
                           <Image src={firstItem.product.image_url} alt="P" fill className="object-cover" unoptimized />
                        ) : (
                           <ShoppingBag className="m-auto text-slate-300" size={24} />
                        )}
                        {otherItemsCount > 0 && (
                           <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold backdrop-blur-[1px]">+{otherItemsCount}</div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                         <div className="flex justify-between items-start">
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                              <h3 className="text-sm font-bold text-slate-900 truncate">{firstItem?.product.name}</h3>
                           </div>
                         </div>
                         
                         <div className="flex items-center justify-between mt-2">
                           <p className="text-lg font-black text-slate-900">{settings?.currency || 'INR'} {order.total_amount.toLocaleString()}</p>
                           
                           {/* --- OUTSIDE REVIEW BUTTON (Appears on Card) --- */}
                           {order.status === 'Delivered' && (
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation(); // Don't open details modal
                                 if (!isReviewed) openReviewModal(firstItem.product, firstItem.product_id, order.id);
                               }}
                               disabled={!!isReviewed}
                               className={`
                                 flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm
                                 ${isReviewed 
                                   ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                   : 'bg-zinc-900 text-white hover:bg-zinc-700 active:scale-95'}
                               `}
                             >
                               {isReviewed ? (
                                 <><CheckCircle2 size={12} /> Reviewed</>
                               ) : (
                                 <><MessageSquarePlus size={12} /> Review</>
                               )}
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

      {/* --- ORDER DETAILS MODAL --- */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex-none px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-xl font-black text-slate-900">Order Details</h2>
                <div className="flex items-center gap-2 mt-1">
                   <span className="font-mono text-xs font-bold bg-slate-50 border border-gray-200 px-1.5 py-0.5 rounded text-slate-600">#{selectedOrder.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-black"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="space-y-4">
                {selectedOrder.items.map((item, idx) => {
                   const isItemReviewed = reviewedProductIds.has(item.product_id);
                   return (
                    <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm items-center">
                        <div className="flex items-center gap-4 w-full">
                          <div className="relative h-16 w-16 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                            {item.product.image_url && <Image src={item.product.image_url} alt="p" fill className="object-cover" unoptimized />}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-900 text-sm line-clamp-1">{item.product.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{item.product.category}</p>
                            <div className="flex gap-3 mt-1 text-xs text-slate-500">
                                <span>Qty: {item.quantity}</span>
                                <span>•</span>
                                <span>{settings?.currency || 'INR'} {item.price.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {selectedOrder.status === 'Delivered' && (
                          <div className="w-full sm:w-auto flex-shrink-0">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isItemReviewed) openReviewModal(item.product, item.product_id, selectedOrder.id);
                              }}
                              disabled={!!isItemReviewed}
                              className={`
                                w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-md whitespace-nowrap
                                ${isItemReviewed 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                                  : 'bg-zinc-900 text-white hover:bg-zinc-700 active:scale-95'}
                              `}
                            >
                              {isItemReviewed ? (
                                <><CheckCircle2 size={14} /> Reviewed</>
                              ) : (
                                <><MessageSquarePlus size={14} /> Write Review</>
                              )}
                            </button>
                          </div>
                        )}
                    </div>
                   );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-2"><MapPin size={14}/> Delivery Address</h3>
                    <div className="text-sm text-slate-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
                       <p className="font-bold text-slate-900 mb-1">{selectedOrder.shipping_address.firstName} {selectedOrder.shipping_address.lastName}</p>
                       <p className="leading-relaxed text-slate-600">{selectedOrder.shipping_address.address}, {selectedOrder.shipping_address.city} - {selectedOrder.shipping_address.pincode}</p>
                       <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 text-xs font-bold text-slate-500"><Phone size={12}/> {selectedOrder.shipping_address.phone}</div>
                    </div>
                 </div>
                 <div>
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-2"><CreditCard size={14}/> Payment Info</h3>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                       <div className="flex justify-between text-sm text-slate-500"><span>Method</span><span className="font-medium text-slate-900 uppercase">{selectedOrder.payment_method.replace('_', ' ')}</span></div>
                       <div className="h-px bg-gray-200 my-2" />
                       <div className="flex justify-between text-base font-black text-slate-900"><span>Total Paid</span><span>{settings?.currency || 'INR'} {selectedOrder.total_amount.toLocaleString()}</span></div>
                    </div>
                 </div>
              </div>
            </div>

            <div className="flex-none p-5 border-t border-gray-100 bg-white flex flex-col gap-3">
              {isOrderCancellable(selectedOrder.status) && (
                 <button onClick={() => handleCancelOrder(selectedOrder.id)} disabled={!!cancelling} className="w-full py-3.5 bg-white border border-red-500 text-red-600 font-bold text-sm rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                    {cancelling ? <Loader2 className="animate-spin" size={16} /> : <Ban size={16} />} Cancel Order
                 </button>
              )}
              {isClient && (
                <PDFDownloadLink document={<InvoicePDF order={selectedOrder} settings={settings!} />} fileName={`invoice-${selectedOrder.id.slice(0,6)}.pdf`} className="w-full">
                  {({ loading }) => (
                    <button disabled={loading} className="w-full bg-black text-white py-3.5 border border-black rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md">
                      {loading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} Download Invoice
                    </button>
                  )}
                </PDFDownloadLink>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- REVIEW MODAL RENDER --- */}
      {reviewProduct && (
        <ReviewModal 
          isOpen={reviewModalOpen} 
          onClose={() => setReviewModalOpen(false)} 
          product={reviewProduct} 
          orderId={activeOrderId}
          onSuccess={fetchData} // <--- REFRESH DATA ON SUCCESS
        />
      )}

    </div>
  );
}