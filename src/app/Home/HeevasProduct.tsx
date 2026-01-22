"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
// 1. Import useRouter for navigation
import { useRouter } from "next/navigation"; 
import { Playfair_Display, Montserrat } from "next/font/google";
import { Heart, ShoppingBag, Star, Loader2, ImageOff, LogIn } from "lucide-react";
import { supabaseClient } from "../../lib/supabaseClient";
import { Toaster, toast } from "sonner"; 

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

export default function ProductSection() {
  const supabase = supabaseClient();
  const router = useRouter(); // 2. Initialize Router

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartLoading, setCartLoading] = useState<string | null>(null);

  // --- Fetch Products ---
  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq('show_on_home', true)
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) console.error("Error fetching products:", error);
    else setProducts(data || []);
    
    setLoading(false);
  };

  // --- Fetch User Wishlist ---
  const fetchUserWishlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("wishlist_items")
        .select("product_id")
        .eq("user_id", user.id);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (data) setWishlist(data.map((item: any) => item.product_id));
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchProducts();
      await fetchUserWishlist();
    };
    void load();
  }, []);

  // --- 3. Toggle Wishlist ---
  // Added 'e' (event) to stop bubbling
  const toggleWishlist = async (e: React.MouseEvent, productId: string, productName: string) => {
    e.stopPropagation(); // Prevent card click
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.custom(() => (
        <div className="bg-white border-l-4 border-black p-4 shadow-xl rounded-sm flex items-start gap-3 w-full">
          <LogIn className="w-5 h-5 text-gray-900 mt-0.5" />
          <div>
            <h4 className={`${playfair.className} font-bold text-gray-900`}>Login Required</h4>
            <p className="text-xs text-gray-500 mt-1">Please login to save items.</p>
          </div>
        </div>
      ));
      return;
    }

    if (wishlist.includes(productId)) {
      await supabase.from("wishlist_items").delete().eq("user_id", user.id).eq("product_id", productId);
      setWishlist(prev => prev.filter(id => id !== productId));
      toast("Removed from Wishlist", { description: `${productName} removed.`, icon: <Heart className="w-4 h-4 text-gray-400" /> });
    } else {
      await supabase.from("wishlist_items").insert([{ user_id: user.id, product_id: productId }]);
      setWishlist(prev => [...prev, productId]);
      toast("Saved to Wishlist", { 
        description: `${productName} saved.`, 
        icon: <Heart className="w-4 h-4 fill-red-500 text-red-500" />,
        style: { borderColor: '#D4A373' }
      });
    }
  };

  // --- 4. Add to Cart ---
  // Added 'e' (event) to stop bubbling
  const addToCart = async (e: React.MouseEvent, productId: string, productName: string) => {
    e.stopPropagation(); // Prevent card click
    
    setCartLoading(productId);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Login Required", { description: "Please login to shop." });
      setCartLoading(null);
      return;
    }

    const { error } = await supabase.from("cart_items").insert([{ user_id: user.id, product_id: productId, quantity: 1 }]);

    if (error) {
      toast.error("Error", { description: "Could not add item to cart." });
    } else {
      toast.success(
        <div className="flex flex-col">
          <span className={`${playfair.className} text-base font-bold`}>Added to Cart</span>
          <span className="text-gray-500 text-xs mt-1"><span className="font-semibold text-gray-800">{productName}</span> is in your bag.</span>
        </div>,
        { duration: 4000, icon: <ShoppingBag className="w-5 h-5 text-[#D4A373]" /> }
      );
    }
    setCartLoading(null);
  };

  // --- 5. Navigation Handler ---
  const handleProductClick = (id: string) => {
    router.push(`/product/${id}`);
  };

  return (
    <section className={`w-full py-20 bg-[#F9F9FB] ${montserrat.className}`}>
      <Toaster position="bottom-right" richColors theme="light" toastOptions={{ style: { borderRadius: '2px', padding: '16px', fontFamily: montserrat.style.fontFamily }, className: 'shadow-2xl border border-gray-100' }} />

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-gray-200 pb-6">
          <div>
            <span className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-2 block">Our Collection</span>
            <h2 className={`${playfair.className} text-4xl md:text-5xl text-gray-900`}>Explore Products</h2>
          </div>
          <button className="hidden md:block px-8 py-3 bg-white border text-black border-gray-900 text-xs tracking-widest uppercase font-medium hover:bg-black hover:text-white transition-all duration-300">View All</button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-sm uppercase tracking-widest">Accessing Heevas Database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <div 
                key={product.id} 
                onClick={() => handleProductClick(product.id)} // 3. Card Click Event
                className="group flex flex-col h-full bg-white rounded-sm overflow-hidden hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-gray-100 cursor-pointer" // Added cursor-pointer
              >
                {/* Image Area */}
                <div className="relative w-full aspect-[3/4] bg-gray-50 overflow-hidden">
                  {product.status && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="text-[10px] font-bold px-3 py-1 uppercase tracking-wider text-white bg-black shadow-sm">{product.status}</span>
                    </div>
                  )}

                  <button
                    onClick={(e) => toggleWishlist(e, product.id, product.name)} // Pass event 'e'
                    className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm transition-all"
                  >
                    <Heart className={`w-4 h-4 transition-colors ${wishlist.includes(product.id) ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-gray-900"}`} />
                  </button>

                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill unoptimized={true} className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageOff size={32} /></div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
                    <button
                      onClick={(e) => addToCart(e, product.id, product.name)} // Pass event 'e'
                      disabled={cartLoading === product.id}
                      className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 disabled:bg-gray-700"
                    >
                      {cartLoading === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                      {cartLoading === product.id ? "Adding..." : "Add to Cart"}
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex flex-col flex-grow p-5 text-center">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">{product.category || "General"}</span>
                  <h3 className={`${playfair.className} text-xl font-medium text-gray-900 mb-2 group-hover:text-[#D4A373] transition-colors`}>{product.name}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">{product.description}</p>
                  <div className="flex-grow"></div>
                  <div className="w-8 h-[1px] bg-gray-200 mx-auto my-3"></div>
                  <div className="flex justify-center items-center gap-1 mb-2 h-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < 4 ? "fill-[#D4A373] text-[#D4A373]" : "fill-gray-100 text-gray-100"}`} />
                    ))}
                  </div>
                  <div className="flex justify-center items-center gap-3">
                    <span className="text-gray-900 font-semibold text-lg tracking-tight">₹{Number(product.price).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}