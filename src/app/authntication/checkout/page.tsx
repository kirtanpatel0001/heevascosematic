'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Image from 'next/image';
import { supabaseClient } from '@/lib/supabaseClient';
import { createOrder, initiateRazorpay } from '@/app/auth/logout/checkout.actions';
import { validateCoupon } from '@/app/actions/couponActions';
import type { LucideIcon } from 'lucide-react';
import {
  Loader2, Receipt, MapPin, User, Phone, Building2, Navigation, Flag,
  Home, ShieldCheck, AlertCircle, Save, CheckCircle2, Trash2, Briefcase,
  MoreHorizontal, CreditCard, Tag, X, Check, Percent, IndianRupee,
  ShoppingBag,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────
interface CartItem {
  id: string;
  quantity: number;
  product: { id: string; name: string; price: number; image_url: string | null };
  size?: string | null;
  color?: string | null;
}

interface CartRow {
  id: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
  product: CartItem['product'] | CartItem['product'][];
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

interface AppliedCoupon {
  id: string;
  code: string;
  discount_value: number;
  discount_type: string;
  description: string | null;
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string | undefined;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => Promise<void>;
  prefill: { name: string; contact: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
}

type RazorpayConstructor = new (options: RazorpayOptions) => { open: () => void };

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

// ── Helpers ────────────────────────────────────────────────────
const fmt = (currency: string, n: number) =>
  `${currency} ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function calcDiscount(subtotal: number, value: number, type: string): number {
  if (type === 'percentage') return Math.min((subtotal * value) / 100, subtotal);
  return Math.min(value, subtotal);
}

// ── Input Field ────────────────────────────────────────────────
type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon: LucideIcon;
  className?: string;
};

const InputField = ({ icon: Icon, className, ...props }: InputFieldProps) => (
  <div className={`relative ${className || ''}`}>
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
      <Icon size={16} />
    </div>
    <input
      {...props}
      className="w-full border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-sm text-black outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-gray-400"
    />
  </div>
);

// ══════════════════════════════════════════════════════════════
export default function CheckoutPage() {
  const router   = useRouter();
  const supabase = supabaseClient();

  // UI
  const [loading, setLoading]               = useState(true);
  const [submitting, setSubmitting]         = useState(false);
  const [savingAddress, setSavingAddress]   = useState(false);
  const [deletingAddress, setDeletingAddress] = useState(false);
  const [errorMsg, setErrorMsg]             = useState<string | null>(null);
  const [successMsg, setSuccessMsg]         = useState<string | null>(null);
  // Data
  const [cartItems, setCartItems]           = useState<CartItem[]>([]);
  const [addresses, setAddresses]           = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [settings, setSettings]             = useState<StoreSettings | null>(null);

  // Coupon
  const [couponInput, setCouponInput]       = useState('');
  const [appliedCoupon, setAppliedCoupon]   = useState<AppliedCoupon | null>(null);
  const [couponLoading, setCouponLoading]   = useState(false);
  const [couponError, setCouponError]       = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Form
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '',
    houseNo: '', street: '', landmark: '',
    city: '', state: '', pincode: '',
    labelType: 'Home', customLabel: '',
  });

  // ── Computed totals (GST-inclusive pricing) ──────────────────
  //
  // Product prices stored in DB are GST-INCLUSIVE.
  // Flow:
  //   1. Strip GST out  → base price = price / (1 + taxRate/100)
  //   2. Subtotal       = Σ (basePrice × qty)
  //   3. Discount       applies on subtotal (ex-GST)
  //   4. GST            = (subtotal - discount) × taxRate/100
  //   5. Grand Total    = subtotal - discount + GST + shipping
  //
  const taxRate    = settings?.tax_rate || 0;
  const currency   = settings?.currency || 'INR';

  // Ex-GST subtotal (prices stripped of GST)
  const subtotal   = cartItems.reduce(
    (a, i) => a + (i.product.price / (1 + taxRate / 100)) * i.quantity,
    0
  );

  // Discount on ex-GST subtotal
  // (discountAmount state is already computed from subtotal on applyCoupon)

  // GST re-applied on discounted ex-GST amount
  const taxAmount  = ((subtotal - discountAmount) * taxRate) / 100;

  const shipping   = (() => {
    const dc = settings?.delivery_charge || 0;
    const ft = settings?.free_shipping_threshold || 0;
    // threshold check against inclusive price total (what user sees)
    const inclusiveTotal = cartItems.reduce((a, i) => a + i.product.price * i.quantity, 0);
    if (ft > 0 && inclusiveTotal >= ft) return 0;
    return dc;
  })();

  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount + shipping);

  // ── Refresh addresses ────────────────────────────────────────
  const refreshAddresses = async (userId: string) => {
    const { data } = await supabase
      .from('addresses')
      .select('id, label, house_no, street, landmark, city, state, pincode')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setAddresses(data);
  };

  // ── Init ─────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.replace('/auth/login?redirect=/authntication/checkout');
          return;
        }

        const [settingsRes, profileRes, cartRes, addressRes] = await Promise.all([
          supabase
            .from('store_settings')
            .select('store_name, currency, delivery_charge, free_shipping_threshold, tax_name, tax_rate')
            .eq('id', 1)
            .single(),
          supabase.from('profiles').select('full_name, phone').eq('id', user.id).single(),
          supabase.from('cart_items')
            .select('id, quantity, size, color, product:products(id, name, price, image_url)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('addresses')
            .select('id, label, house_no, street, landmark, city, state, pincode')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
        ]);

        if (settingsRes.data) setSettings(settingsRes.data);

        if (profileRes.data) {
          const names = (profileRes.data.full_name || '').split(' ');
          setFormData(prev => ({
            ...prev,
            firstName: names[0] || '',
            lastName:  names.slice(1).join(' ') || '',
            phone:     profileRes.data.phone || '',
          }));
        }

        if (cartRes.data) {
          if (cartRes.data.length === 0) { router.replace('/authntication/shop'); return; }
          const rows = cartRes.data as CartRow[];
          setCartItems(rows.map((i) => ({
            id: i.id, quantity: i.quantity, size: i.size, color: i.color,
            product: Array.isArray(i.product) ? i.product[0] : i.product,
          })));
        }

        if (addressRes.data) setAddresses(addressRes.data);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    })();
  }, [router, supabase]);

  // ── Address handlers ─────────────────────────────────────────
  const handleAddressSelect = (id: string) => {
    setSelectedAddressId(id);
    setErrorMsg(null); setSuccessMsg(null);
    if (id === 'new') {
      setFormData(prev => ({
        ...prev, houseNo: '', street: '', landmark: '',
        city: '', state: '', pincode: '', labelType: 'Home', customLabel: '',
      }));
    } else {
      const addr = addresses.find(a => a.id === id);
      if (addr) {
        let lType = 'Other', cLabel = addr.label;
        if (addr.label === 'Home') { lType = 'Home'; cLabel = ''; }
        else if (addr.label === 'Work') { lType = 'Work'; cLabel = ''; }
        setFormData(prev => ({
          ...prev,
          houseNo: addr.house_no || '', landmark: addr.landmark || '',
          street: addr.street, city: addr.city, state: addr.state,
          pincode: addr.pincode, labelType: lType, customLabel: cLabel,
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
    if (!confirm('Delete this address?')) return;
    setDeletingAddress(true);
    try {
      const { error } = await supabase.from('addresses').delete().eq('id', selectedAddressId);
      if (error) throw error;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await refreshAddresses(user.id);
      handleAddressSelect('new');
      setSuccessMsg('Address deleted.');
    } catch { setErrorMsg('Failed to delete address.'); }
    finally { setDeletingAddress(false); }
  };

  const handleSaveAddress = async () => {
    setSavingAddress(true); setErrorMsg(null); setSuccessMsg(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please login to save address.');

      const c = {
        houseNo:  formData.houseNo.trim(),
        street:   formData.street.trim(),
        landmark: formData.landmark.trim(),
        city:     formData.city.trim(),
        state:    formData.state.trim(),
        pincode:  formData.pincode.trim(),
      };

      let finalLabel = formData.labelType;
      if (formData.labelType === 'Other') {
        finalLabel = formData.customLabel.trim();
        if (!finalLabel) throw new Error('Please enter a name for this address.');
      }

      if (!c.houseNo || !c.street || !c.city || !c.pincode) throw new Error('Please fill all required address fields.');
      if (c.pincode.length < 6) throw new Error('Invalid pincode.');

      if (selectedAddressId === 'new') {
        if (addresses.length >= 2) throw new Error('You can save max 2 addresses.');
        const { error } = await supabase.from('addresses').insert([{
          user_id: user.id, label: finalLabel, house_no: c.houseNo, street: c.street,
          landmark: c.landmark, city: c.city, state: c.state, pincode: c.pincode,
          is_default: addresses.length === 0,
        }]);
        if (error) throw error;
        setSuccessMsg('Address saved!');
      } else {
        const { error } = await supabase.from('addresses').update({
          label: finalLabel, house_no: c.houseNo, street: c.street,
          landmark: c.landmark, city: c.city, state: c.state, pincode: c.pincode,
        }).eq('id', selectedAddressId).eq('user_id', user.id);
        if (error) throw error;
        setSuccessMsg('Address updated!');
      }
      await refreshAddresses(user.id);
    } catch (e: unknown) { setErrorMsg(getErrorMessage(e, 'Failed to save address.')); }
    finally { setSavingAddress(false); }
  };

  // ── Coupon ───────────────────────────────────────────────────
  // Coupon discount is calculated on ex-GST subtotal
  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true); setCouponError(null);
    try {
      const c = await validateCoupon(couponInput);
      // Pass ex-GST subtotal so discount is on base price
      const disc = calcDiscount(subtotal, c.discount_value, c.discount_type);
      setAppliedCoupon(c); setDiscountAmount(disc);
    } catch (e: unknown) {
      setCouponError(getErrorMessage(e, 'Failed to apply coupon.'));
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } finally { setCouponLoading(false); }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null); setCouponInput(''); setCouponError(null); setDiscountAmount(0);
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true); setErrorMsg(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Session expired. Please login again.');

      const c = {
        firstName: formData.firstName.trim(),
        lastName:  formData.lastName.trim(),
        phone:     formData.phone.trim(),
        houseNo:   formData.houseNo.trim(),
        street:    formData.street.trim(),
        landmark:  formData.landmark.trim(),
        city:      formData.city.trim(),
        state:     formData.state.trim(),
        pincode:   formData.pincode.trim(),
      };

      if (!c.firstName) throw new Error('First name is required.');
      if (!c.lastName)  throw new Error('Last name is required.');
      if (!/^[6-9]\d{9}$/.test(c.phone)) throw new Error('Enter a valid 10-digit mobile number.');
      if (!c.houseNo || !c.street || !c.city || !c.pincode) throw new Error('Please fill all delivery address fields.');
      if (!/^\d{6}$/.test(c.pincode)) throw new Error('Enter a valid 6-digit pincode.');

      const fullAddress = `${c.houseNo}, ${c.street}${c.landmark ? `, Near ${c.landmark}` : ''}, ${c.city} - ${c.pincode}`;

      const fd = new FormData();
      fd.set('firstName', c.firstName);
      fd.set('lastName',  c.lastName);
      fd.set('phone',     c.phone);
      fd.set('address',   fullAddress);
      fd.set('city',      c.city);
      fd.set('state',     c.state);
      fd.set('pincode',   c.pincode);
      if (appliedCoupon) fd.set('couponCode', appliedCoupon.code);

      const orderData = await initiateRazorpay(appliedCoupon?.code);

      const options: RazorpayOptions = {
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      orderData.amount,
        currency:    orderData.currency,
        name:        settings?.store_name || 'HEEVAS',
        description: 'Order Payment',
        order_id:    orderData.id,
        handler: async (response: RazorpaySuccessResponse) => {
          fd.set('paymentMethod',        'card');
          fd.set('razorpay_payment_id',   response.razorpay_payment_id);
          fd.set('razorpay_order_id',     response.razorpay_order_id);
          fd.set('razorpay_signature',    response.razorpay_signature);
          try {
            const result = await createOrder(fd);
            router.push(`/authntication/order-success?id=${result.orderId}`);
          } catch (err: unknown) {
            setErrorMsg(getErrorMessage(err, 'Payment verification failed.'));
            setSubmitting(false);
          }
        },
        prefill: { name: `${c.firstName} ${c.lastName}`, contact: c.phone },
        theme:   { color: '#000000' },
        modal:   { ondismiss: () => setSubmitting(false) },
      };

      const Razorpay = (window as Window & { Razorpay?: RazorpayConstructor }).Razorpay;
      if (!Razorpay) throw new Error('Payment gateway failed to load.');
      const rzp = new Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, 'Something went wrong.'));
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
      <Loader2 className="animate-spin text-black" size={36} />
    </div>
  );

  const totalQty = cartItems.reduce((a, i) => a + i.quantity, 0);
  // Inclusive total for display in product list
  const inclusiveSubtotal = cartItems.reduce((a, i) => a + i.product.price * i.quantity, 0);

  // ════════════════════════════════════════════════════════════
  return (
    <main className="min-h-screen bg-[#F9FAFB] py-8 md:py-12 px-4 text-black font-sans overflow-x-hidden">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ══ LEFT: FORM ══════════════════════════════════════ */}
        <section className="lg:col-span-7 space-y-5">

          {/* Alerts */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" /> {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2.5">
              <CheckCircle2 size={16} className="shrink-0" /> {successMsg}
            </div>
          )}

          {/* ── Personal Info + Address ──────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-black text-black flex items-center gap-2">
                <ShieldCheck size={18} /> Shipping Details
              </h2>
              {addresses.length > 0 && (
                <select
                  value={selectedAddressId}
                  onChange={e => handleAddressSelect(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg py-1.5 px-3 bg-gray-50 font-semibold cursor-pointer outline-none focus:border-black"
                >
                  <option value="new">+ Add New</option>
                  {addresses.map(addr => (
                    <option key={addr.id} value={addr.id}>
                      {addr.label} ({addr.pincode})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField icon={User}  name="firstName" value={formData.firstName} onChange={handleInputChange} required placeholder="First Name" />
              <InputField icon={User}  name="lastName"  value={formData.lastName}  onChange={handleInputChange} required placeholder="Last Name" />
              <InputField icon={Phone} name="phone"     value={formData.phone}     onChange={handleInputChange} required placeholder="Mobile Number (10 digits)" maxLength={10} className="md:col-span-2" />

              <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-1">
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-3 flex items-center gap-1.5">
                  <MapPin size={11} /> Delivery Address
                </p>
              </div>

              <InputField icon={Home}      name="houseNo"  value={formData.houseNo}  onChange={handleInputChange} required placeholder="Flat / House No." className="md:col-span-2" />
              <InputField icon={Building2} name="street"   value={formData.street}   onChange={handleInputChange} required placeholder="Street / Colony / Area" className="md:col-span-2" />
              <InputField icon={Flag}      name="landmark" value={formData.landmark} onChange={handleInputChange} placeholder="Landmark (Optional)" className="md:col-span-2" />
              <InputField icon={MapPin}    name="pincode"  value={formData.pincode}  onChange={handleInputChange} required placeholder="Pincode" maxLength={6} />
              <InputField icon={Building2} name="city"     value={formData.city}     onChange={handleInputChange} required placeholder="City" />
              <InputField icon={Navigation} name="state"   value={formData.state}    onChange={handleInputChange} required placeholder="State" className="md:col-span-2" />

              {/* Address Label */}
              <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-1">
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-3">Save Address As</p>
                <div className="flex flex-wrap gap-2">
                  {(['Home', 'Work', 'Other'] as const).map(type => (
                    <button
                      key={type} type="button"
                      onClick={() => setFormData(prev => ({ ...prev, labelType: type }))}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all
                        ${formData.labelType === type
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                        }`}
                    >
                      {type === 'Home' && <Home size={13} />}
                      {type === 'Work' && <Briefcase size={13} />}
                      {type === 'Other' && <MoreHorizontal size={13} />}
                      {type}
                    </button>
                  ))}
                </div>
                {formData.labelType === 'Other' && (
                  <input
                    type="text" value={formData.customLabel}
                    onChange={e => setFormData(prev => ({ ...prev, customLabel: e.target.value }))}
                    placeholder="e.g. Office, Parents' Home…"
                    className="mt-3 w-full border border-gray-200 rounded-lg py-2.5 px-4 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                )}
              </div>

              {/* Save / Delete buttons */}
              <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-1 flex justify-between items-center">
                {selectedAddressId !== 'new' ? (
                  <button
                    type="button" onClick={handleDeleteAddress} disabled={deletingAddress}
                    className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1.5 px-2 py-2 transition-colors"
                  >
                    {deletingAddress ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />} Delete
                  </button>
                ) : <div />}
                <button
                  type="button" onClick={handleSaveAddress} disabled={savingAddress}
                  className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl border transition-all
                    ${selectedAddressId === 'new'
                      ? 'bg-black text-white border-black hover:bg-zinc-800'
                      : 'bg-white text-black border-black hover:bg-gray-50'
                    }`}
                >
                  {savingAddress ? <Loader2 className="animate-spin" size={13} /> : <Save size={13} />}
                  {selectedAddressId === 'new' ? 'Save for Future' : 'Update Address'}
                </button>
              </div>
            </div>
          </div>

        </section>

        {/* ══ RIGHT: ORDER SUMMARY ════════════════════════════ */}
        <aside className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:sticky lg:top-6">

            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-base font-black text-black flex items-center gap-2">
                <Receipt size={18} /> Order Summary
              </h2>
            </div>

            {/* ── Products — always visible ─────────────────── */}
            <div className="divide-y divide-gray-50">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-6 py-4">
                  {/* Image */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                    {item.product?.image_url ? (
                      <Image
                        src={item.product.image_url}
                        alt={item.product.name}
                        fill sizes="56px" className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={16} className="text-gray-300" />
                      </div>
                    )}
                    {/* Qty badge */}
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                      {item.quantity}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wide truncate leading-tight">
                      {item.product?.name}
                    </p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {item.size  && <span className="text-[10px] text-slate-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">{item.size}</span>}
                      {item.color && <span className="text-[10px] text-slate-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">{item.color}</span>}
                      <span className="text-[10px] text-slate-400">Qty: {item.quantity}</span>
                    </div>
                  </div>

                  {/* Price — show inclusive price (as stored in DB) */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900">
                      {fmt(currency, item.product.price * item.quantity)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {fmt(currency, item.product.price)} each
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Price Breakdown ──────────────────────────── */}
            <div className="px-6 py-4 space-y-2.5 text-sm border-t border-gray-100 bg-gray-50/40">

              {/* Subtotal shown as inclusive (what user paid / product price total) */}
              <div className="flex justify-between text-gray-500">
                <span>Subtotal ({totalQty} {totalQty === 1 ? 'item' : 'items'})</span>
                <span className="font-semibold text-black">{fmt(currency, inclusiveSubtotal)}</span>
              </div>

              {/* GST extracted from inclusive price, shown as a line item */}
              {!!taxRate && (
                <div className="flex justify-between text-gray-500">
                  <span>{settings?.tax_name || 'GST'} ({taxRate}%) <span className="text-[10px] text-gray-400">(incl.)</span></span>
                  <span className="font-semibold text-black">
                    {/* GST extracted from inclusive subtotal before any discount */}
                    {fmt(currency, inclusiveSubtotal - subtotal)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span className={`font-semibold ${shipping === 0 ? 'text-emerald-600' : 'text-black'}`}>
                  {shipping === 0 ? 'FREE' : `+ ${fmt(currency, shipping)}`}
                </span>
              </div>

              {/* ── Coupon — right after shipping ─────────── */}
              <div className="pt-1 pb-0.5">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-3 mt-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                        <Check size={13} className="text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-black text-emerald-800 tracking-widest text-xs">
                            {appliedCoupon.code}
                          </span>
                          <span className="text-[10px] font-black bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            {appliedCoupon.discount_type === 'percentage'
                              ? <><Percent size={8} />{appliedCoupon.discount_value}% OFF</>
                              : <><IndianRupee size={8} />{appliedCoupon.discount_value} OFF</>
                            }
                          </span>
                        </div>
                        {/* Show total saving = discount on base + GST difference */}
                        <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                          − {fmt(currency, discountAmount + discountAmount * taxRate / 100)} saved 🎉
                        </p>
                      </div>
                    </div>
                    <button
                      type="button" onClick={removeCoupon}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5 mt-1">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text" value={couponInput}
                          onChange={e => {
                            setCouponInput(e.target.value.replace(/\s+/g, '').toUpperCase());
                            setCouponError(null);
                          }}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), applyCoupon())}
                          placeholder="COUPON CODE"
                          className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs font-mono uppercase tracking-widest outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder-gray-400 bg-white"
                        />
                      </div>
                      <button
                        type="button" onClick={applyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="px-4 py-2.5 bg-black text-white rounded-xl text-xs font-black hover:bg-zinc-800 transition-colors disabled:opacity-40 flex items-center gap-1 whitespace-nowrap"
                      >
                        {couponLoading ? <Loader2 size={12} className="animate-spin" /> : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-500 flex items-center gap-1.5 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                        <X size={11} className="shrink-0" /> {couponError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Coupon discount line — shows base discount + GST saved combined */}
              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-emerald-600 flex items-center gap-1.5">
                    <Tag size={11} /> Discount
                  </span>
                  {/* discountAmount is on ex-GST base; add GST portion for display */}
                  <span className="font-bold text-emerald-600">
                    − {fmt(currency, discountAmount + discountAmount * taxRate / 100)}
                  </span>
                </div>
              )}

              <div className="h-px bg-gray-200 my-1" />

              {/* Total */}
              <div className="flex justify-between items-start text-black font-black text-base">
                <span>Total</span>
                <div className="text-right">
                  <p>{fmt(currency, grandTotal)}</p>
                  {discountAmount > 0 && (
                    <p className="text-[11px] font-bold text-emerald-600">
                      You save {fmt(currency, discountAmount + discountAmount * taxRate / 100)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Pay Now ─────────────────────────────────── */}
            <div className="px-6 pb-6 pt-2">
              <button
                type="submit" disabled={submitting}
                className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-60"
              >
                {submitting
                  ? <><Loader2 className="animate-spin" size={15} /> Processing…</>
                  : <><CreditCard size={15} /> Pay Now · {fmt(currency, grandTotal)}</>
                }
              </button>

              <div className="mt-4 flex justify-center items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Secured by Razorpay · 256-bit SSL
              </div>
            </div>

          </div>
        </aside>

      </form>
    </main>
  );
}