'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script'; 
import { supabaseClient } from '@/lib/supabaseClient';
import { createOrder, initiateRazorpay } from '@/app/auth/logout/checkout.actions';
import {
  Loader2, Receipt, MapPin, User, Phone, Building2, Navigation, Flag,
  Home, ShieldCheck, AlertCircle, Save, CheckCircle2, Trash2, Briefcase, 
  MoreHorizontal, CreditCard
} from 'lucide-react';

// --- TYPES ---
interface OrderSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  taxName: string;
}

interface StoreSettings {
  store_name: string;
  currency: string;
  delivery_charge: number;
  free_shipping_threshold: number;
  tax_name: string;
  tax_rate: number;
}

interface SavedAddress {
  id: string;
  label: string;
  house_no?: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = supabaseClient();

  // UI States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false); 
  const [deletingAddress, setDeletingAddress] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Data State
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '',
    houseNo: '', street: '', landmark: '', city: '', state: '', pincode: '',
    labelType: 'Home', customLabel: ''
  });

  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [summary, setSummary] = useState<OrderSummary>({
    subtotal: 0, tax: 0, shipping: 0, total: 0, currency: 'INR', taxName: 'Tax'
  });

  // --- HELPER: REFRESH ADDRESSES ---
  const refreshAddresses = async (userId: string) => {
      const { data } = await supabase.from('addresses').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (data) setAddresses(data);
  };

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const initData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.replace('/auth/login?redirect=/checkout');
          return;
        }

        const { data: settingsData } = await supabase.from('store_settings').select('*').eq('id', 1).single();
        if (settingsData) setSettings(settingsData);

        const { data: profile } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).single();
        if (profile) {
           const names = (profile.full_name || '').split(' ');
           setFormData(prev => ({
             ...prev,
             firstName: names[0] || '',
             lastName: names.slice(1).join(' ') || '',
             phone: profile.phone || ''
           }));
        }

        await refreshAddresses(user.id);

        const { data: cartItems } = await supabase.from('cart_items').select(`quantity, product:products (price)`).eq('user_id', user.id);
        
        let subtotal = 0;
        if (cartItems) {
          subtotal = cartItems.reduce((acc: number, item: any) => acc + (item.product.price * item.quantity), 0);
        }

        if (settingsData) {
            const taxAmount = (subtotal * settingsData.tax_rate) / 100;
            let shippingCost = settingsData.delivery_charge;
            if (settingsData.free_shipping_threshold > 0 && subtotal >= settingsData.free_shipping_threshold) {
                shippingCost = 0;
            }
            setSummary({
                subtotal,
                tax: taxAmount,
                shipping: shippingCost,
                total: subtotal + taxAmount + shippingCost,
                currency: settingsData.currency,
                taxName: settingsData.tax_name
            });
        }
        setLoading(false);
      } catch (error) {
        console.error("Init Error:", error);
        setLoading(false);
      }
    };
    initData();
  }, [router, supabase]);

  // --- 2. ADDRESS HANDLERS ---
  const handleAddressSelect = (id: string) => {
    setSelectedAddressId(id);
    setErrorMsg(null);
    setSuccessMsg(null);
    
    if (id === 'new') {
        setFormData(prev => ({ 
            ...prev, 
            houseNo: '', street: '', landmark: '', city: '', state: '', pincode: '',
            labelType: 'Home', customLabel: '' 
        }));
    } else {
        const addr = addresses.find(a => a.id === id);
        if (addr) {
            let lType = 'Other';
            let cLabel = addr.label;
            if (addr.label === 'Home') { lType = 'Home'; cLabel = ''; }
            else if (addr.label === 'Work') { lType = 'Work'; cLabel = ''; }

            setFormData(prev => ({
                ...prev,
                houseNo: addr.house_no || '',
                landmark: addr.landmark || '',
                street: addr.street,
                city: addr.city,
                state: addr.state,
                pincode: addr.pincode,
                labelType: lType,
                customLabel: cLabel
            }));
        }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if ((name === 'phone' || name === 'pincode') && !/^\d*$/.test(value)) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeleteAddress = async () => {
    if (selectedAddressId === 'new') return;
    if (!confirm("Are you sure you want to delete this address?")) return;

    setDeletingAddress(true);
    try {
        const { error } = await supabase.from('addresses').delete().eq('id', selectedAddressId);
        if (error) throw error;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await refreshAddresses(user.id);
        handleAddressSelect('new');
        setSuccessMsg("Address deleted successfully.");
    } catch (error: any) {
        setErrorMsg("Failed to delete address.");
    } finally {
        setDeletingAddress(false);
    }
  };

  const handleSaveOrUpdateAddress = async () => {
    setSavingAddress(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Please login to save address");

        const cleanData = {
            houseNo: formData.houseNo.trim(),
            street: formData.street.trim(),
            landmark: formData.landmark.trim(),
            city: formData.city.trim(),
            state: formData.state.trim(),
            pincode: formData.pincode.trim(),
        };

        let finalLabel = formData.labelType;
        if (formData.labelType === 'Other') {
            finalLabel = formData.customLabel.trim();
            if (!finalLabel) throw new Error("Please enter a name for this address.");
        }

        if (!cleanData.houseNo || !cleanData.street || !cleanData.city || !cleanData.pincode) {
            throw new Error("Please fill all address fields.");
        }
        if (cleanData.pincode.length < 6) throw new Error("Invalid Pincode");

        if (selectedAddressId === 'new') {
            if (addresses.length >= 2) throw new Error("Address limit reached (Max 2).");
            const { error } = await supabase.from('addresses').insert([{
                user_id: user.id, label: finalLabel, house_no: cleanData.houseNo,
                street: cleanData.street, landmark: cleanData.landmark, city: cleanData.city,
                state: cleanData.state, pincode: cleanData.pincode, is_default: addresses.length === 0
            }]);
            if (error) throw error;
            setSuccessMsg("Address saved!");
        } else {
            const { error } = await supabase.from('addresses').update({
                label: finalLabel, house_no: cleanData.houseNo, street: cleanData.street,
                landmark: cleanData.landmark, city: cleanData.city, state: cleanData.state,
                pincode: cleanData.pincode
            }).eq('id', selectedAddressId).eq('user_id', user.id);
            if (error) throw error;
            setSuccessMsg("Address updated!");
        }
        await refreshAddresses(user.id);
    } catch (error: any) {
        setErrorMsg(error.message || "Failed to save address");
    } finally {
        setSavingAddress(false);
    }
  };

  // --- 5. MAIN SUBMIT HANDLER (RAZORPAY + REDIRECT) ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Session expired.");

        // Validation
        const cleanData = {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            phone: formData.phone.trim(),
            houseNo: formData.houseNo.trim(),
            street: formData.street.trim(),
            landmark: formData.landmark.trim(),
            city: formData.city.trim(),
            state: formData.state.trim(),
            pincode: formData.pincode.trim(),
        };
        const fullAddressString = `${cleanData.houseNo}, ${cleanData.street} ${cleanData.landmark ? `, Near ${cleanData.landmark}` : ''}, ${cleanData.city} - ${cleanData.pincode}`;
        if (cleanData.phone.length < 10) throw new Error("Invalid phone number.");

        // PREPARE FORM DATA
        const secureForm = new FormData();
        secureForm.set('firstName', cleanData.firstName);
        secureForm.set('lastName', cleanData.lastName);
        secureForm.set('phone', cleanData.phone);
        secureForm.set('address', fullAddressString); 
        secureForm.set('city', cleanData.city);
        secureForm.set('state', cleanData.state);
        secureForm.set('pincode', cleanData.pincode);

        // --- DIRECT RAZORPAY FLOW ---
        // 1. Get Order ID from Server
        const orderData = await initiateRazorpay();

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          name: settings?.store_name || "Store Payment",
          description: "Order Transaction",
          order_id: orderData.id,
          
          // 2. ON SUCCESS - NOW WITH REDIRECT!
          handler: async function (response: any) {
              secureForm.set('paymentMethod', 'card');
              secureForm.set('razorpay_payment_id', response.razorpay_payment_id);
              secureForm.set('razorpay_order_id', response.razorpay_order_id);
              secureForm.set('razorpay_signature', response.razorpay_signature);
              
              try {
                  // 3. Call Server Action to Verify & Save
                  const result = await createOrder(secureForm);

                  // 4. MANUAL REDIRECT TO SUCCESS PAGE (FIXED!)
                  // Matches your folder name: authntication (missing 'e')
                  router.push(`/authntication/order-success?id=${orderData.id}`);

              } catch (err: any) {
                  // Ignore Next.js redirect errors
                  if (err.message === 'NEXT_REDIRECT') return;

                  setErrorMsg(err.message || "Verification Failed");
                  setSubmitting(false);
              }
          },
          prefill: {
              name: `${cleanData.firstName} ${cleanData.lastName}`,
              contact: cleanData.phone,
          },
          theme: { color: "#000000" },
          modal: { ondismiss: function() { setSubmitting(false); } }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();

    } catch (error: any) {
        setErrorMsg(error.message);
        setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center overflow-x-hidden"><Loader2 className="animate-spin text-black" size={40} /></div>;

  return (
    <main className="min-h-screen bg-[#F9FAFB] py-8 md:py-12 px-4 text-black font-sans overflow-x-hidden">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- LEFT: FORM --- */}
        <section className="lg:col-span-7 space-y-6">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-lg font-bold text-black flex items-center gap-2"><ShieldCheck size={20} /> Checkout</h2>
               {addresses.length > 0 && (
                 <select value={selectedAddressId} onChange={(e) => handleAddressSelect(e.target.value)} className="text-xs md:text-sm border border-gray-200 rounded-md py-1.5 px-3 bg-gray-50 font-medium cursor-pointer">
                   <option value="new">+ Add New Address</option>
                   {addresses.map(addr => <option key={addr.id} value={addr.id}>{addr.label} ({addr.pincode})</option>)}
                 </select>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField icon={User} name="firstName" value={formData.firstName} onChange={handleInputChange} required placeholder="First Name" />
              <InputField icon={User} name="lastName" value={formData.lastName} onChange={handleInputChange} required placeholder="Last Name" />
              <InputField icon={Phone} name="phone" value={formData.phone} onChange={handleInputChange} required placeholder="Phone (10 digits)" maxLength={10} className="md:col-span-2" />
              
              <div className="md:col-span-2 pt-4 pb-1 border-t border-gray-100 mt-2">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2 flex items-center gap-1"><MapPin size={12} /> Delivery Location</p>
              </div>

              <InputField icon={Home} name="houseNo" value={formData.houseNo} onChange={handleInputChange} required placeholder="Flat / House No." className="md:col-span-2" />
              <InputField icon={Building2} name="street" value={formData.street} onChange={handleInputChange} required placeholder="Street / Colony" className="md:col-span-2" />
              <InputField icon={Flag} name="landmark" value={formData.landmark} onChange={handleInputChange} placeholder="Landmark (Optional)" className="md:col-span-2" />
              <InputField icon={MapPin} name="pincode" value={formData.pincode} onChange={handleInputChange} required placeholder="Pincode" maxLength={6} />
              <InputField icon={Building2} name="city" value={formData.city} onChange={handleInputChange} required placeholder="City" />
              <InputField icon={Navigation} name="state" value={formData.state} onChange={handleInputChange} required placeholder="State" className="md:col-span-2" />

              {/* SAVE ADDRESS SECTION */}
              <div className="md:col-span-2 pt-4 border-t border-gray-100 mt-2">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-3">Save Address As</p>
                  <div className="flex flex-wrap gap-3 items-center">
                     {['Home', 'Work', 'Other'].map(type => (
                         <button key={type} type="button" onClick={() => setFormData(prev => ({ ...prev, labelType: type }))} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all ${formData.labelType === type ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-black'}`}>
                             {type === 'Home' && <Home size={14} />}
                             {type === 'Work' && <Briefcase size={14} />}
                             {type === 'Other' && <MoreHorizontal size={14} />}
                             {type}
                         </button>
                     ))}
                  </div>
                  {formData.labelType === 'Other' && (
                       <div className="mt-3"><input type="text" value={formData.customLabel} onChange={(e) => setFormData(prev => ({ ...prev, customLabel: e.target.value }))} placeholder="Ex: Office" className="w-full border border-gray-200 rounded-lg py-2 px-4 text-sm outline-none focus:border-black" /></div>
                  )}
              </div>

              <div className="md:col-span-2 pt-4 flex justify-between items-center border-t border-gray-100 mt-4">
                  {selectedAddressId !== 'new' ? (
                      <button type="button" onClick={handleDeleteAddress} disabled={deletingAddress} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2 px-2 py-2">
                         {deletingAddress ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />} Delete
                      </button>
                  ) : <div></div>}
                  <button type="button" onClick={handleSaveOrUpdateAddress} disabled={savingAddress} className={`text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg border transition-all flex items-center gap-2 ${selectedAddressId === 'new' ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:bg-gray-50'}`}>
                     {savingAddress ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                     {selectedAddressId === 'new' ? 'Save For Future' : 'Update Changes'}
                  </button>
              </div>
            </div>
          </div>
        </section>

        {/* --- RIGHT: SUMMARY --- */}
        <aside className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
             <h2 className="text-lg font-bold text-black flex items-center gap-2 mb-6"><Receipt size={20} /> Order Summary</h2>
             <div className="space-y-4 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-medium text-black">{summary.currency} {summary.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-600"><span>{summary.taxName} ({settings?.tax_rate}%)</span><span className="font-medium text-black">+ {summary.currency} {summary.tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="font-medium text-black">{summary.shipping === 0 ? <span className="text-green-600 font-bold text-xs uppercase">Free</span> : `+ ${summary.currency} ${summary.shipping.toFixed(2)}`}</span></div>
                <div className="h-px bg-gray-100 my-4"></div>
                <div className="flex justify-between text-lg font-bold text-black"><span>Total</span><span>{summary.currency} {summary.total.toFixed(2)}</span></div>
             </div>
             
             {/* PAY NOW BUTTON */}
             <button type="submit" disabled={submitting} className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all shadow-lg flex justify-center items-center gap-2 mt-8 disabled:opacity-70">
                {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Pay Now'}
             </button>
             
             <div className="mt-4 flex justify-center items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-green-500"></div> Secure Checkout
             </div>
          </div>
        </aside>
      </form>
    </main>
  );
}

const InputField = ({ icon: Icon, className, ...props }: any) => (
  <div className={`relative ${className || ''}`}>
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Icon size={16} /></div>
    <input {...props} className="w-full border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-sm text-black outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-gray-400" />
  </div>
);