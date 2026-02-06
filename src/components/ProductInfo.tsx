"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import {
  Star, Minus, Plus, ShoppingBag, Heart,
  Droplets, Shield, Sparkles, Wind,
  CheckCircle, Lock
} from "lucide-react";
import { Playfair_Display, Montserrat } from "next/font/google";
import { toast } from "sonner"; 

const playfair = Playfair_Display({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });

/* ---------------- PILL GROUP ---------------- */
const PillGroup = ({ title, items }: { title: string; items?: string[] }) => {
  if (!items || items.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest mb-3 text-zinc-900">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="px-3 py-1.5 text-[11px] font-medium border border-zinc-300 rounded-full text-zinc-800"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

interface ProductInfoProps {
  product: any;
  ratingStats?: { 
    average: number; 
    count: number; 
  };
}

export default function ProductInfo({ product, ratingStats }: ProductInfoProps) {
  const supabase = supabaseClient();
  const router = useRouter();

  const [qty, setQty] = useState(1);
  const [wish, setWish] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // --- STATS LOGIC ---
  const avgRating = ratingStats?.average || 0;
  const reviewCount = ratingStats?.count || 0;

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    const checkWishlist = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('wishlist_items')
          .select('id')
          .eq('user_id', user.id)
          .eq('product_id', product.id)
          .maybeSingle();
        
        if (data) setWish(true);
      }
    };
    checkWishlist();
  }, [product.id, supabase]);

  const price = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(product.price);

  const benefits =
    typeof product.benefits === "string"
      ? product.benefits.split(",").slice(0, 4)
      : [];

  const icon = (t: string) =>
    t.toLowerCase().includes("hydr") ? <Droplets size={15} /> :
    t.toLowerCase().includes("repair") ? <Shield size={15} /> :
    t.toLowerCase().includes("shine") ? <Sparkles size={15} /> :
    <Wind size={15} />;

  // --- AUTH CHECK ---
  const checkLogin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please log in", {
        description: "You need to sign in to perform this action.",
        action: {
            label: "Login",
            onClick: () => router.push('/auth/login') 
        }
      });
      return null;
    }
    return user;
  };

  // --- ADD TO BAG ---
  const handleAddToBag = async () => {
    setIsAdding(true);
    try {
      const user = await checkLogin();
      if (!user) {
          setIsAdding(false);
          return;
      }

      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (existingItem) {
        const newQty = existingItem.quantity + qty;
        await supabase
            .from('cart_items')
            .update({ quantity: newQty })
            .eq('id', existingItem.id);
      } else {
        await supabase
            .from('cart_items')
            .insert([{ user_id: user.id, product_id: product.id, quantity: qty }]);
      }

      toast.success(`Added ${qty} x ${product.name} to your bag`, {
        description: "View your cart to checkout",
        style: { background: '#333', color: '#fff', border: 'none' }
      });

    } catch (error) {
        console.error("Cart Error:", error);
        toast.error("Could not add to cart. Please try again.");
    } finally {
        setIsAdding(false);
    }
  };

  // --- WISHLIST ---
  const handleWishlist = async () => {
    const previousState = wish;
    setWish(!wish); 

    try {
      const user = await checkLogin();
      if (!user) {
        setWish(previousState);
        return;
      }

      if (previousState === true) {
        await supabase
            .from('wishlist_items')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', product.id);
            
        toast("Removed from Wishlist", {
            style: { background: '#fff', color: '#000', border: '1px solid #eee' }
        });
      } else {
        const { error } = await supabase
            .from('wishlist_items')
            .insert([{ user_id: user.id, product_id: product.id }]);
        
        if (error) throw error;

        toast.success("Added to Wishlist", {
            description: `${product.name} is saved for later.`,
            style: { background: '#333', color: '#fff', border: 'none' }
        });
      }
    } catch (error) {
        console.error("Wishlist Error:", error);
        setWish(previousState);
        toast.error("Something went wrong.");
    }
  };

  // --- RENDER STARS (YELLOW GOLD) ---
  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          size={16}
          className={`${
            i < Math.floor(rating) 
              ? "text-yellow-500 fill-yellow-500"
              : "text-zinc-200 fill-zinc-100"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className={`${montserrat.className} space-y-14`}>

      {/* HERO */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
          {product.category}
        </span>

        <h1 className={`${playfair.className} text-[42px] leading-[1.15] mt-2 text-black`}>
          {product.name}
        </h1>

        {/* --- DYNAMIC RATING SECTION --- */}
        <div className="flex items-center gap-3 mt-4">
          {renderStars(avgRating)}
          
          <span className="text-sm font-bold text-zinc-900">
            {avgRating > 0 ? `${avgRating}/5` : "No reviews yet"}
          </span>
          
          {reviewCount > 0 && (
             <span className="text-xs text-zinc-500 underline underline-offset-2 cursor-pointer decoration-zinc-300 hover:text-black hover:decoration-black transition-all">
                ({reviewCount} Reviews)
             </span>
          )}
        </div>

        <div className="mt-7 text-4xl font-medium text-black">
          {price}
        </div>
      </div>

      {/* BENEFITS */}
      {benefits.length > 0 && (
        <div className="grid grid-cols-4 gap-8 border-y border-zinc-100 py-8">
              {benefits.map((b: string, i: number) => (
                <div key={i} className="text-center space-y-3">
                  <div className="w-11 h-11 mx-auto rounded-full border border-zinc-300 text-zinc-800 flex items-center justify-center">
                    {icon(b)}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-700">
                    {b.trim()}
                  </p>
                </div>
          ))}
        </div>
      )}

      {/* PILLS */}
      <div className="space-y-8">
        <PillGroup title="Hair Type" items={product.hair_type} />
        <PillGroup title="Shop by Concern" items={product.concerns} />
      </div>

      {/* CTA SECTION */}
      <div className="space-y-6">
        <div className="flex gap-5 h-14">
          
          {/* QTY SELECTOR */}
          <div className="flex items-center border border-zinc-300 rounded-lg px-4 w-32 justify-between">
            <button 
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="hover:text-zinc-500 transition-colors p-2"
            >
                <Minus size={16} />
            </button>
            <span className="font-bold text-zinc-900">{qty}</span>
            <button 
                onClick={() => setQty(qty + 1)}
                className="hover:text-zinc-500 transition-colors p-2"
            >
                <Plus size={16} />
            </button>
          </div>

          {/* ADD TO BAG BUTTON */}
          <button 
            onClick={handleAddToBag}
            disabled={isAdding}
            className="flex-1 bg-black text-white rounded-lg flex items-center justify-center gap-3 hover:bg-zinc-800 transition-colors active:scale-[0.98] px-4"
          >
            <span className="text-xs font-bold uppercase tracking-[0.15em] whitespace-nowrap">
                {isAdding ? "Adding..." : "Add to Bag"}
            </span>
            {!isAdding && <ShoppingBag size={16} strokeWidth={2} />}
          </button>

          {/* WISHLIST BUTTON */}
          <button
            onClick={handleWishlist}
            className={`w-14 border border-zinc-300 rounded-lg flex items-center justify-center transition-colors ${wish ? 'border-red-500 bg-red-50' : 'hover:border-zinc-400'}`}
          >
            <Heart size={18} fill={wish ? "#ef4444" : "none"} stroke={wish ? "#ef4444" : "currentColor"} />
          </button>
        </div>

        {/* TRUST BADGES */}
        <div className="flex justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          <span className="flex items-center gap-2">
            <CheckCircle size={14} /> 100% Authentic
          </span>
          <span className="flex items-center gap-2">
            <Lock size={14} /> Secure Pay
          </span>
          <span className="flex items-center gap-2">
            <Sparkles size={14} /> Premium Quality
          </span>
        </div>
      </div>
    </div>
  );
}