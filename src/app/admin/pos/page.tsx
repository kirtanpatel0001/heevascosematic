'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, 
  CreditCard, Banknote, Loader2, PackageX, User, Phone 
} from 'lucide-react';
import Image from 'next/image';

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  sku: string | null;
};

type CartItem = Product & {
  cartQuantity: number;
};

export default function POSTerminal() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Customer Data
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('id, name, price, stock, image_url, sku')
      .eq('is_visible', true)
      .gt('stock', 0) // Only show in-stock items
      .order('name');
    
    if (data) setProducts(data);
    setLoading(false);
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= product.stock) return prev;
        return prev.map((item) =>
          item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.id === id) {
        const newQty = item.cartQuantity + delta;
        const product = products.find(p => p.id === id);
        if (newQty < 1) return item;
        if (product && newQty > product.stock) return item;
        return { ...item, cartQuantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subTotal = cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);

  // --- NEW CHECKOUT LOGIC ---
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!customerName.trim()) { alert("Please enter Customer Name"); return; }
    if (!customerPhone.trim()) { alert("Please enter Phone Number"); return; }

    setProcessing(true);

    try {
      // 1. Insert into new 'pos_sales' table
      const { error: salesError } = await supabase
        .from('pos_sales')
        .insert({
          customer_name: customerName,
          customer_phone: customerPhone,
          total_amount: subTotal,
          payment_method: paymentMethod,
          items: cart // Saving the entire cart as JSON
        });

      if (salesError) throw salesError;

      // 2. Reduce Stock in 'products' table
      for (const item of cart) {
        const newStock = item.stock - item.cartQuantity;
        await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
      }

      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setSuccessMsg('Order Placed Successfully!');
      fetchProducts(); // Refresh stock
      setTimeout(() => setSuccessMsg(''), 3000);

    } catch (error: any) {
      console.error(error);
      alert('Checkout Failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      {/* LEFT: Products */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" placeholder="Search products..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id} onClick={() => addToCart(product)} disabled={product.stock <= 0}
                  className="group flex flex-col text-left bg-gray-50 hover:bg-white hover:ring-2 hover:ring-black/5 border border-transparent hover:border-black/5 rounded-xl p-3 transition-all active:scale-95"
                >
                  <div className="relative w-full aspect-square bg-white rounded-lg mb-3 overflow-hidden border border-gray-100">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300"><PackageX size={24} /></div>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-snug mb-1">{product.name}</h3>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="font-bold text-gray-900">₹{product.price}</span>
                    <span className="text-[10px] text-gray-500 bg-gray-200/50 px-1.5 py-0.5 rounded">Qty: {product.stock}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div className="w-[380px] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/30 space-y-3">
          <div className="flex items-center gap-2 text-gray-800 font-bold"><ShoppingCart size={18} /> Order Details</div>
          <div className="relative">
            <User className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-black" placeholder="Customer Name" />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-black" placeholder="Phone Number" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm"><ShoppingCart size={32} className="mb-2 opacity-20" /><p>Cart Empty</p></div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-3 items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                  <p className="text-xs text-gray-500">₹{item.price} x {item.cartQuantity}</p>
                </div>
                <div className="flex items-center gap-2 border border-gray-200 rounded-md">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-100"><Minus size={12}/></button>
                  <span className="w-6 text-center text-xs font-medium">{item.cartQuantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-100"><Plus size={12}/></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['CASH', 'UPI', 'CARD'].map((m) => (
              <button key={m} onClick={() => setPaymentMethod(m as any)}
                className={`text-xs font-medium py-2 rounded border flex flex-col items-center gap-1 ${paymentMethod === m ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}
              >
                {m === 'CASH' ? <Banknote size={14}/> : <CreditCard size={14}/>} {m}
              </button>
            ))}
          </div>
          <div className="flex justify-between items-end mb-4">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-2xl font-bold text-gray-900">₹{subTotal}</span>
          </div>
          <button onClick={handleCheckout} disabled={cart.length === 0 || processing} className="w-full bg-black text-white py-3 rounded-lg flex justify-center items-center gap-2 hover:bg-zinc-800 disabled:opacity-50">
            {processing ? <Loader2 className="animate-spin" size={18}/> : 'Complete Order'}
          </button>
          {successMsg && <p className="text-xs text-green-600 text-center mt-2 font-medium animate-pulse">{successMsg}</p>}
        </div>
      </div>
    </div>
  );
}