'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import Drawer from './Drawer';
import Link from 'next/link';
// We use standard <img> tags to avoid Runtime AbortErrors with next/image in drawers
import { 
  Heart, 
  X, 
  PackageOpen, 
  MoveRight, 
  ShoppingCart, 
  Loader2 
} from 'lucide-react';

type Props = { open: boolean; onClose: () => void };

// Helper for Currency
const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function WishlistDrawer({ open, onClose }: Props) {
  const supabase = supabaseClient();

  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 1. SETUP USER ID ON MOUNT
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  // 2. FETCH DATA FUNCTION
  const fetchWishlist = async () => {
    if (!userId) return;
    
    // Only show loader on first load to prevent flickering
    if (wishlistItems.length === 0) setLoading(true);

    const { data, error } = await supabase
      .from('wishlist_items')
      .select(`
        id,
        product:products (
          id, name, price, image_url, category
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wishlist:', error);
    } else {
      const formatted = data.map((item: any) => ({
        wishlist_id: item.id,
        product_id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image_url,
        category: item.product.category
      }));
      setWishlistItems(formatted);
    }
    setLoading(false);
  };

  // 3. SAFE REALTIME LISTENER
  // Updates instantly when items are added, but cleans up to prevent crashes
  useEffect(() => {
    // Only subscribe when we have a user and the drawer is open
    if (!userId || !open) return;

    fetchWishlist();

    const channel = supabase
      .channel('wishlist_realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'wishlist_items',
          filter: `user_id=eq.${userId}` // 🔒 CRITICAL: Only listen to MY wishlist
        },
        () => {
          fetchWishlist();
        }
      )
      .subscribe();

    // 🔒 CRITICAL: Stop listening when component unmounts or drawer closes
    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Failed to remove wishlist realtime channel', err);
      }
    };
  }, [userId, open]);

  // --- ACTIONS ---

  const removeItem = async (wishlistId: string) => {
    // Optimistic Update
    setWishlistItems(prev => prev.filter(item => item.wishlist_id !== wishlistId));
    
    await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', wishlistId);
  };

  const moveToCart = async (item: any) => {
    if (!userId) return;

    // 1. Add to Cart Table
    const { error } = await supabase
      .from('cart_items')
      .insert([{
        user_id: userId,
        product_id: item.product_id,
        quantity: 1
      }]);

    if (!error) {
      // 2. Remove from Wishlist if successful
      await removeItem(item.wishlist_id);
      // Optional: You could trigger a toast notification here
    } else {
      console.error('Error moving to cart', error);
      alert('Could not move item to cart.');
    }
  };

  return (
    <Drawer open={open} onClose={onClose} side="right" widthClass="w-full sm:w-[420px]">
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white z-10">
        <div className="flex items-center gap-2.5">
          <Heart size={20} strokeWidth={2} className="text-zinc-900 fill-zinc-900" />
          <h3 className="text-[17px] font-semibold tracking-tight text-zinc-900">Your Wishlist</h3>
          <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {wishlistItems.length}
          </span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-zinc-50 rounded-full transition-all group">
          <X size={20} strokeWidth={1.5} className="text-black group-hover:text-zinc-900" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading && wishlistItems.length === 0 ? (
           <div className="h-full flex items-center justify-center text-gray-400">
             <Loader2 className="animate-spin" size={32} />
           </div>
        ) : wishlistItems.length === 0 ? (
          
          // --- EMPTY STATE ---
          <div className="flex flex-col items-center justify-center h-full p-10 text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-zinc-50 rounded-full scale-[2.5] -z-10" />
              <PackageOpen size={56} strokeWidth={1} className="text-zinc-300" />
            </div>
            
            <h4 className="text-lg font-medium text-zinc-900 mb-2">Your wishlist is empty</h4>
            <p className="text-[14px] text-zinc-500 max-w-[240px] leading-relaxed mb-10">
              Save items for later by clicking the heart icon while you shop.
            </p>

            <Link 
              href="/authntication/shop" 
              onClick={onClose}
              className="group flex items-center gap-2 bg-zinc-900 text-white px-10 py-3.5 rounded-full text-sm font-medium hover:bg-black transition-all active:scale-[0.98]"
            >
              Start Exploring
              <MoveRight size={16} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        ) : (
          
          // --- POPULATED LIST ---
          <div className="p-6 space-y-6">
            {wishlistItems.map((item) => (
              <div key={item.wishlist_id} className="flex gap-4 group">
                {/* Image - Using standard img to fix AbortError */}
                <div className="h-28 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 relative">
                   {item.image ? (
                     /* eslint-disable-next-line @next/next/no-img-element */
                     <img 
                       src={item.image} 
                       alt={item.name} 
                       className="h-full w-full object-cover"
                     />
                   ) : (
                     <div className="h-full w-full flex items-center justify-center text-gray-300"><Heart size={24} /></div>
                   )}
                   {/* Quick Remove Button Overlay */}
                   <button 
                     onClick={() => removeItem(item.wishlist_id)}
                     className="absolute top-1 right-1 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                   >
                     <X size={14} />
                   </button>
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between py-1">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                      <Link href={`/product/${item.product_id}`} onClick={onClose}>{item.name}</Link>
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                    <p className="text-sm font-bold text-gray-900 mt-2">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => moveToCart(item)}
                      className="flex-1 flex items-center justify-center gap-2 bg-black text-white text-xs font-bold py-2.5 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      <ShoppingCart size={14} /> Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </Drawer>
  );
}