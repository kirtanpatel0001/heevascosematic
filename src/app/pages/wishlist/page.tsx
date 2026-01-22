'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ChevronDown, ShoppingBag, Search, User, Heart, 
  Instagram, Facebook, Twitter, Loader2, ImageOff, Filter, X, LogIn 
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

// --- TYPES ---
interface Product {
  id: string;
  name: string;
  category: string;
  hair_type: string;
  price: number;
  image_url: string | null;
  description: string;
  stock: number;
  status: string;
}

export default function ShopPage() {
    const supabase = supabaseClient();

  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // UI States
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedHairType, setSelectedHairType] = useState('All');
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortOrder, setSortOrder] = useState('default');

  // --- 1. FETCH PRODUCTS ---
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'Active')
        .order('created_at', { ascending: false });

      if (!error && data) setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  // --- HELPER: CHECK LOGIN ---
  const checkLogin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoginModalOpen(true);
      return null;
    }
    return user;
  };

  // --- 2. ADD TO CART ---
  const addToCart = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const user = await checkLogin();
    if (!user) return;

    setActionLoading(productId);

    try {
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();

      if (existingItem) {
        await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);
      } else {
        await supabase
          .from('cart_items')
          .insert([{ user_id: user.id, product_id: productId, quantity: 1 }]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  // --- 3. TOGGLE WISHLIST ---
  const toggleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const user = await checkLogin();
    if (!user) return;

    const { error } = await supabase
      .from('wishlist_items')
      .insert([{ user_id: user.id, product_id: productId }]);

    if (error) {
      await supabase
        .from('wishlist_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
    }
  };

  // --- FILTER LOGIC ---
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesHairType = selectedHairType === 'All' || p.hair_type === selectedHairType;
      const matchesPrice = p.price <= maxPrice;
      return matchesSearch && matchesCategory && matchesHairType && matchesPrice;
    });

    if (sortOrder === 'low-to-high') result.sort((a, b) => a.price - b.price);
    if (sortOrder === 'high-to-low') result.sort((a, b) => b.price - a.price);
    
    return result;
  }, [searchTerm, selectedCategory, selectedHairType, maxPrice, sortOrder, products]);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category))).filter(Boolean)];
  const hairTypes = ['All', ...Array.from(new Set(products.map(p => p.hair_type))).filter(Boolean)];

  return (
   
    <div>
      
    </div>
  );
}