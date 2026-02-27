"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Playfair_Display, Cormorant_Garamond } from "next/font/google";
import { Heart, ShoppingBag, ImageOff, LogIn, Loader2, ArrowUpRight } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";
import { Toaster, toast } from "sonner";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

interface ProductWithStats {
  id: string;
  name: string;
  category: string;
  price: number;
  image_url: string | null;
  status: string | null;
  avg_rating: number;
  total_reviews: number;
}

interface ProductSectionClientProps {
  initialProducts?: ProductWithStats[];
  initialWishlist?: string[];
}

export default function ProductSectionClient({
  initialProducts = [],
  initialWishlist = [],
}: ProductSectionClientProps) {
  const supabase = supabaseClient();
  const router = useRouter();

  const [products] = useState<ProductWithStats[]>(initialProducts || []);
  const [wishlist, setWishlist] = useState<string[]>(initialWishlist || []);
  const [cartLoading, setCartLoading] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const toggleWishlist = async (e: React.MouseEvent, productId: string, productName: string) => {
    e.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.custom(() => (
        <div style={{ fontFamily: "'Cormorant Garamond', serif" }} className="bg-[#0A0A0A] border border-white/10 p-5 shadow-2xl flex items-start gap-3 w-full">
          <LogIn className="w-4 h-4 text-[#C9A96E] mt-0.5 shrink-0" />
          <div>
            <h4 className={`${playfair.className} font-semibold text-white text-sm`}>Sign in Required</h4>
            <p className="text-xs text-white/40 mt-1 tracking-wide">Please login to save to your wishlist.</p>
          </div>
        </div>
      ));
      return;
    }
    const isLiked = wishlist.includes(productId);
    setWishlist(prev => isLiked ? prev.filter(id => id !== productId) : [...prev, productId]);
    if (isLiked) {
      await supabase.from("wishlist_items").delete().eq("user_id", user.id).eq("product_id", productId);
      toast("Removed from Wishlist", { description: `${productName} removed.` });
    } else {
      await supabase.from("wishlist_items").insert([{ user_id: user.id, product_id: productId }]);
      toast("Saved to Wishlist ♡", { description: `${productName} saved.` });
    }
  };

  const addToCart = async (e: React.MouseEvent, productId: string, productName: string) => {
    e.stopPropagation();
    setCartLoading(productId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Sign in Required", { description: "Please login to shop." });
      setCartLoading(null);
      return;
    }
    const { error } = await supabase.from("cart_items").insert([{ user_id: user.id, product_id: productId, quantity: 1 }]);
    if (error) {
      toast.error("Error", { description: "Could not add item to cart." });
    } else {
      toast.success(`${productName} added to your bag`, { duration: 3000 });
    }
    setCartLoading(null);
  };

  const handleProductClick = (id: string) => router.push(`/product/${id}`);

  return (
    <>
      <style>{`
        :root {
          --gold: #C9A96E;
          --gold-light: #E8D5B0;
          --ink: #0A0A0A;
          --cream: #FAF8F5;
          --warm-gray: #F2EFE9;
        }

        .product-card {
          position: relative;
          background: #fff;
          transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s ease;
        }
        .product-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 30px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(201,169,110,0.15);
        }

        .img-zoom {
          transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .product-card:hover .img-zoom {
          transform: scale(1.07);
        }

        .cart-btn {
          transform: translateY(100%);
          transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .product-card:hover .cart-btn {
          transform: translateY(0);
        }

        .wishlist-btn {
          opacity: 0;
          transform: scale(0.8);
          transition: opacity 0.25s ease, transform 0.25s ease, background 0.2s ease;
        }
        .product-card:hover .wishlist-btn {
          opacity: 1;
          transform: scale(1);
        }

        .section-number {
          font-size: 100px;
          font-weight: 300;
          color: rgba(0,0,0,0.04);
          line-height: 1;
          position: absolute;
          right: -10px;
          top: -20px;
          pointer-events: none;
          user-select: none;
        }

        .gold-line {
          width: 40px;
          height: 1px;
          background: var(--gold);
          display: inline-block;
        }

        .view-all-btn {
          position: relative;
          overflow: hidden;
          border: 1px solid var(--ink);
          background: transparent;
          color: var(--ink);
          transition: color 0.3s ease;
        }
        .view-all-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--ink);
          transform: translateX(-100%);
          transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .view-all-btn:hover::before { transform: translateX(0); }
        .view-all-btn:hover { color: #fff; }
        .view-all-btn span { position: relative; z-index: 1; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-reveal {
          opacity: 0;
          animation: fadeInUp 0.6s ease forwards;
        }
      `}</style>

      <section
        style={{ background: "var(--cream)", fontFamily: "'Cormorant Garamond', serif" }}
        className="w-full py-24 overflow-hidden"
      >
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#0A0A0A",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "0",
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "14px",
            },
          }}
        />

        <div className="max-w-7xl mx-auto px-6 md:px-10">

          {/* ── Header ── */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="relative">
              <span className="section-number">01</span>
              <p
                style={{ letterSpacing: "0.28em", color: "var(--gold)", fontSize: "11px" }}
                className="uppercase font-semibold mb-3 flex items-center gap-3"
              >
                <span className="gold-line" />
                Curated Collection
              </p>
              <h2
                className={`${playfair.className} text-5xl md:text-6xl font-medium text-[#0A0A0A] leading-tight`}
              >
                Explore
                <br />
                <em className="font-normal" style={{ color: "var(--gold)" }}>Products</em>
              </h2>
            </div>

            <div className="flex flex-col items-end gap-3">
              <p className={`${cormorant.className} text-gray-400 text-base max-w-xs text-right leading-relaxed hidden md:block`}>
                Handpicked pieces crafted with intention — each one a quiet statement.
              </p>
              <button
                onClick={() => router.push("/shop")}
                className="view-all-btn px-8 py-3 text-xs tracking-[0.2em] uppercase font-semibold flex items-center gap-2"
              >
                <span>View All</span>
                <span><ArrowUpRight className="w-3.5 h-3.5" /></span>
              </button>
            </div>
          </div>

          {/* ── Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products && products.length > 0 ? (
              products.map((product, idx) => (
                <div
                  key={product.id}
                  className="product-card card-reveal cursor-pointer"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                  onClick={() => handleProductClick(product.id)}
                  onMouseEnter={() => setHoveredId(product.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Image */}
                  <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#F5F3EF]">
                    {/* Wishlist */}
                    <button
                      onClick={(e) => toggleWishlist(e, product.id, product.name)}
                      className="wishlist-btn absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center bg-white shadow-md hover:bg-[#0A0A0A] group/heart"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors group-hover/heart:text-white group-hover/heart:fill-white ${
                          wishlist.includes(product.id)
                            ? "fill-red-500 text-red-500"
                            : "text-[#0A0A0A]"
                        }`}
                      />
                    </button>

                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="img-zoom object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ImageOff size={28} />
                      </div>
                    )}

                    {/* Cart CTA */}
                    <div className="cart-btn absolute inset-x-0 bottom-0 z-10">
                      <button
                        onClick={(e) => addToCart(e, product.id, product.name)}
                        disabled={cartLoading === product.id}
                        className="w-full bg-[#0A0A0A] text-white py-4 text-[10px] font-bold uppercase tracking-[0.22em] flex items-center justify-center gap-2 hover:bg-[#C9A96E] transition-colors duration-300 disabled:bg-gray-600"
                        style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
                      >
                        {cartLoading === product.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShoppingBag className="w-3.5 h-3.5" />
                        )}
                        {cartLoading === product.id ? "Adding…" : "Add to Bag"}
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 border-t border-gray-100">
                    <span
                      style={{
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                        letterSpacing: "0.18em",
                        fontSize: "9px",
                        fontWeight: 600,
                        color: "#aaa",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      {product.category || "General"}
                    </span>

                    <h3
                      style={{
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                        fontSize: "14px",
                        fontWeight: 500,
                        letterSpacing: "0.02em",
                        lineHeight: "1.4",
                        marginBottom: "14px",
                        color: hoveredId === product.id ? "var(--gold)" : "#0A0A0A",
                        transition: "color 0.3s",
                      }}
                    >
                      {product.name}
                    </h3>

                    {/* Stars */}

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <span
                        style={{
                          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                          fontWeight: 500,
                          fontSize: "15px",
                          letterSpacing: "0.04em",
                          color: "#0A0A0A",
                        }}
                      >
                        ₹{Number(product.price).toLocaleString("en-IN")}
                      </span>
                      <div
                        style={{ width: "28px", height: "1px", background: "var(--gold)" }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                <div
                  style={{ width: "1px", height: "60px", background: "var(--gold)" }}
                  className="animate-pulse"
                />
                <p
                  style={{ letterSpacing: "0.25em", fontSize: "11px" }}
                  className="uppercase text-gray-400 font-semibold"
                >
                  Loading Collection
                </p>
              </div>
            )}
          </div>

          {/* ── Mobile View All ── */}
          <div className="mt-12 flex justify-center md:hidden">
            <button
              onClick={() => router.push("/shop")}
              className="view-all-btn px-10 py-3.5 text-xs tracking-[0.2em] uppercase font-semibold flex items-center gap-2"
            >
              <span>View All Products</span>
              <span><ArrowUpRight className="w-3.5 h-3.5" /></span>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}