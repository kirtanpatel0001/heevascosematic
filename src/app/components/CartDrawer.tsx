'use client';

import { useState, useEffect, useCallback } from 'react';
import Drawer from './Drawer';
import Link from 'next/link';
import { ShoppingBag, X, ArrowRight, ShoppingCart, Minus, Plus, Trash2, Loader2 } from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';

type Props = {
  open: boolean;
  onClose: () => void;
};

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function CartDrawer({ open, onClose }: Props) {
  const supabase = supabaseClient();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 1. Get User
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  // 2. Fetch Function (Wrapped in useCallback to be stable)
  const fetchUserCart = useCallback(async () => {
    if (!userId) return;
    
    // Only show spinner if we have NO items. If we have items, just update silently.
    if (cartItems.length === 0) setLoading(true);

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id, quantity, size, color,
        product:products (id, name, price, image_url, category)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cart:', error);
    } else {
      const formattedCart = data.map((item: any) => ({
        cart_id: item.id,
        product_id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image_url,
        category: item.product.category,
        quantity: item.quantity,
        size: item.size,
        color: item.color
      }));
      setCartItems(formattedCart);
    }
    setLoading(false);
  }, [userId]); // Only recreate if userId changes (cartItems removed from dependency to prevent loops)

  // 3. Trigger Fetch on Open
  useEffect(() => {
    if (open && userId) {
      fetchUserCart();
    }
  }, [open, userId, fetchUserCart]);

  // 4. Realtime Subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('cart_realtime_updates')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'cart_items',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchUserCart();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchUserCart]);

  // --- ACTIONS ---
  const updateQuantity = async (cartId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;

    // Optimistic Update (Instant UI change)
    setCartItems(prev => prev.map(item => 
      item.cart_id === cartId ? { ...item, quantity: newQty } : item
    ));

    // Database Update
    await supabase.from('cart_items').update({ quantity: newQty }).eq('id', cartId);
  };

  const removeItem = async (cartId: string) => {
    // Optimistic Update (Instant UI change)
    setCartItems(prev => prev.filter(item => item.cart_id !== cartId));
    
    // Database Update
    await supabase.from('cart_items').delete().eq('id', cartId);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <Drawer open={open} onClose={onClose} side="right" widthClass="w-full sm:w-[420px]" ariaLabel="Cart">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingBag size={22} className="text-gray-900" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-medium text-white">
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          </div>
          <h3 className="text-xl text-black font-semibold tracking-tight">Your Cart</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X color="black" size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading && cartItems.length === 0 ? (
           <div className="h-full flex items-center justify-center">
             <Loader2 className="animate-spin text-gray-400" size={32} />
           </div>
        ) : cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-50">
              <ShoppingCart size={40} className="text-gray-300" />
            </div>
            <h4 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h4>
            <p className="text-gray-500 max-w-[280px] mb-8 leading-relaxed">
              Looks like you haven&apos;t added anything to your cart yet.
            </p>
            <Link 
              href="/authntication/shop" 
              onClick={onClose}
              className="group flex items-center gap-2 bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-zinc-800 transition-all active:scale-95"
            >
              Start Shopping
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {cartItems.map((item) => (
              <div key={item.cart_id} className="flex gap-4 group">
                <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                  {item.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover object-center" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <ShoppingBag size={20} />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                        <Link href={`/product/${item.product_id}`} onClick={onClose}>{item.name}</Link>
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {item.size ? `Size: ${item.size}` : item.category} 
                        {item.color && ` / ${item.color}`}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 ml-2">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-gray-300 rounded-full h-8 px-2 gap-3">
                      <button 
                        onClick={() => updateQuantity(item.cart_id, item.quantity, -1)}
                        className="text-gray-500 hover:text-black disabled:opacity-30"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-medium w-3 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.cart_id, item.quantity, 1)}
                        className="text-gray-500 hover:text-black"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeItem(item.cart_id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="border-t border-gray-100 p-6 bg-white space-y-4">
          <div className="flex justify-between items-center text-base font-medium text-gray-900">
            <p>Subtotal</p>
            <p>{formatPrice(subtotal)}</p>
          </div>
          <Link
            href="/authntication/checkout"
            onClick={onClose}
            className="w-full bg-black text-white flex items-center justify-center rounded-full py-4 px-6 text-sm font-bold shadow-lg hover:bg-zinc-800 transition-all active:scale-95"
          >
            Checkout -   {formatPrice(subtotal)}
          </Link>
        </div>
      )}
    </Drawer>
  );
}