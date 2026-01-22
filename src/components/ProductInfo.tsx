"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // To redirect if needed
import { supabaseClient } from "@/lib/supabaseClient"; // YOUR SUPABASE CLIENT
import {
  Star, Minus, Plus, ShoppingBag, Heart,
  ChevronDown, Droplets, Shield, Sparkles, Wind,
  CheckCircle, Lock
} from "lucide-react";
import { Playfair_Display, Montserrat } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner"; 

const playfair = Playfair_Display({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });

/* ---------------- ACCORDION ---------------- */
const AccordionItem = ({ title, isOpen, onClick, children }: any) => (
  <div className="border-b border-zinc-200">
    <button
      onClick={onClick}
      className="w-full py-6 flex justify-between items-center group"
    >
      <span className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-900 group-hover:text-black transition-colors">
        {title}
      </span>
      <ChevronDown
        size={16}
        className={`transition-transform text-zinc-900 ${isOpen ? "rotate-180" : ""}`}
      />
    </button>

    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* whitespace-pre-line ensures database text line breaks work */}
          <div className="pb-8 text-sm text-zinc-700 leading-8 whitespace-pre-line">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

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

export default function ProductInfo({ product }: { product: any }) {
  const supabase = supabaseClient();
  const router = useRouter();

  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState("description");
  const [wish, setWish] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // --- INITIAL DATA FETCH (Check Wishlist Status) ---
  useEffect(() => {
    const checkWishlist = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('wishlist_items')
          .select('id')
          .eq('user_id', user.id)
          .eq('product_id', product.id)
          .maybeSingle(); // distinct from .single() to avoid error if null
        
        if (data) setWish(true);
      }
    };
    checkWishlist();
  }, [product.id]);

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

  // --- AUTH CHECK HELPER ---
  const checkLogin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please log in", {
        description: "You need to sign in to perform this action.",
        action: {
            label: "Login",
            onClick: () => router.push('/auth/login') // Update to your login route
        }
      });
      return null;
    }
    return user;
  };

  // --- HANDLE ADD TO BAG (SUPABASE) ---
  const handleAddToBag = async () => {
    setIsAdding(true);
    
    try {
      const user = await checkLogin();
      if (!user) {
          setIsAdding(false);
          return;
      }

      // 1. Check if item exists
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (existingItem) {
        // 2a. Update Quantity
        const newQty = existingItem.quantity + qty;
        await supabase
            .from('cart_items')
            .update({ quantity: newQty })
            .eq('id', existingItem.id);
      } else {
        // 2b. Insert New Row
        await supabase
            .from('cart_items')
            .insert([{ user_id: user.id, product_id: product.id, quantity: qty }]);
      }

      // Success Toast
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

  // --- HANDLE WISHLIST (SUPABASE) ---
  const handleWishlist = async () => {
    // 1. Optimistic UI update (feels faster)
    const previousState = wish;
    setWish(!wish); 

    try {
      const user = await checkLogin();
      if (!user) {
        setWish(previousState); // Revert if not logged in
        return;
      }

      if (previousState === true) {
        // Was liked, now removing
        await supabase
            .from('wishlist_items')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', product.id);
            
        toast("Removed from Wishlist", {
            style: { background: '#fff', color: '#000', border: '1px solid #eee' }
        });

      } else {
        // Was not liked, now adding
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
        setWish(previousState); // Revert on error
        toast.error("Something went wrong.");
    }
  };

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

        <div className="flex items-center gap-3 mt-4">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} fill="#000" strokeWidth={0} />
            ))}
          </div>
          <span className="text-xs font-bold text-zinc-900">4.8/5</span>
        </div>

        <div className="mt-7 text-4xl font-medium text-black">
          {price}
        </div>
      </div>

      {/* BENEFITS */}
      {benefits.length > 0 && (
        <div className="grid grid-cols-4 gap-8 border-y border-zinc-100 py-8">
              {benefits.map((b: string, i: number) => (            <div key={i} className="text-center space-y-3">
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

      {/* ACCORDIONS */}
      <div>
        <AccordionItem title="Description" isOpen={open === "description"} onClick={() => setOpen("description")}>
          <p className="italic text-zinc-700">
            {product.description}
          </p>
        </AccordionItem>

        <AccordionItem title="How to Use" isOpen={open === "ritual"} onClick={() => setOpen("ritual")}>
          <p className="text-zinc-700">{product.how_to_use ? product.how_to_use : "No instructions provided."}</p>
        </AccordionItem>

        <AccordionItem title="Ingredients" isOpen={open === "ingredients"} onClick={() => setOpen("ingredients")}>
          <p className="text-zinc-700">{product.ingredients ? product.ingredients : "No ingredients listed."}</p>
        </AccordionItem>
      </div>

    </div>
  );
}