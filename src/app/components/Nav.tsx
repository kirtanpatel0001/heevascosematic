'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, User, Heart, ShoppingBag, Menu, X, ChevronRight } from 'lucide-react';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import CartDrawer from './CartDrawer';
import WishlistDrawer from './WishlistDrawer';
import { supabaseClient } from '@/lib/supabaseClient';

// PERF: Supabase client created ONCE at module level.
// Previously `supabaseClient()` was called inside the component body, creating
// a brand-new client on every render and invalidating every useEffect that
// listed `supabase` as a dependency.
const supabase = supabaseClient();

const navLinks = [
  { name: 'Home',       href: '/' },
  { name: 'Shop',       href: '/authntication/shop' },
  { name: 'About Us',   href: '/pages/about' },
  { name: 'Contact Us', href: '/pages/contact' },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen,       setIsCartOpen]       = useState(false);
  const [isWishlistOpen,   setIsWishlistOpen]   = useState(false);
  const [isUserMenuOpen,   setIsUserMenuOpen]   = useState(false);
  const [user,             setUser]             = useState<any | null>(null);

  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // ── Body scroll lock ────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
    // Clean up when component unmounts with menu open
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  // ── Close user menu on outside click ────────────────────────────────────────
  // PERF: Listener is only attached while the menu is actually open.
  useEffect(() => {
    if (!isUserMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (!userMenuRef.current?.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  // ── Auth: fetch user + subscribe to changes ─────────────────────────────────
  // PERF: supabase is now the stable module-level instance, so this effect
  // runs exactly once (empty dep array is correct).
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (mounted) setUser(data.user ?? null);
      } catch (err) {
        console.error('Failed to get user', err);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  // PERF: useCallback keeps identity stable so any child that receives these
  // as props won't re-render unnecessarily.
  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsUserMenuOpen(false);
    setUser(null);
  }, []);

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const openMobileMenu  = useCallback(() => setIsMobileMenuOpen(true),  []);
  const toggleUserMenu  = useCallback(() => setIsUserMenuOpen((o) => !o), []);

  return (
    <>
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 w-full z-40 bg-[#C4B4AE] border-b border-gray-200 shadow-sm font-sans text-black">
        <div className="max-w-[1920px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">

          {/* LOGO */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/LOGO/bg34.png"
              alt="Heevas Logo"
              width={240}
              height={320}
              className="h-60 w-auto object-contain"
              priority
            />
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden md:flex items-center space-x-12 h-full">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[13px] font-bold uppercase tracking-[0.15em] text-gray-800 hover:text-black transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* ICONS */}
          <div className="flex items-center gap-3 md:gap-8">
            <div className="hidden md:flex items-center gap-6">
              <Link href="/search" className="hover:text-gray-600 transition-colors" aria-label="Search">
                <Search size={20} strokeWidth={1.5} />
              </Link>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={toggleUserMenu}
                  className="hover:text-gray-600 transition-colors flex items-center gap-2"
                  aria-label="User menu"
                  type="button"
                >
                  {user?.user_metadata?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="avatar"
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : user?.email ? (
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <User size={22} strokeWidth={1.5} />
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 shadow-lg rounded p-2 flex flex-col z-50">
                    {user ? (
                      <>
                        <div className="px-2 py-2 border-b border-gray-100">
                          <div className="text-sm font-semibold">{user.user_metadata?.full_name ?? user.email}</div>
                          <div className="text-xs text-gray-500 truncate">{user.email}</div>
                        </div>
                        <Link href="/authntication/account/profile" className="text-sm font-medium py-2 px-2 hover:bg-gray-50">Profile</Link>
                        <Link href="/authntication/account/order"   className="text-sm font-medium py-2 px-2 hover:bg-gray-50">Orders</Link>
                        <button onClick={handleSignOut}             className="text-sm text-left font-medium py-2 px-2 hover:bg-gray-50">Logout</button>
                      </>
                    ) : (
                      <>
                        <Link href="/auth/login"  className="text-sm font-medium py-2 px-2 hover:bg-gray-50">Login</Link>
                        <Link href="/auth/signup" className="text-sm font-medium py-2 px-2 hover:bg-gray-50">Signup</Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button onClick={() => setIsWishlistOpen(true)} className="hover:text-gray-600 transition-colors" aria-label="Open wishlist">
                <Heart size={22} strokeWidth={1.5} />
              </button>
              <button onClick={() => setIsCartOpen(true)} className="hover:text-gray-600 transition-colors" aria-label="Open cart">
                <ShoppingBag size={22} strokeWidth={1.5} />
              </button>
            </div>

            <button
              className="md:hidden p-2 -mr-2 text-black hover:bg-black/10 rounded-full transition-colors"
              onClick={openMobileMenu}
              aria-label="Open Menu"
            >
              <Menu size={26} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE DRAWER ──────────────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={closeMobileMenu}
      />

      {/* Sliding panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 w-[85%] max-w-[360px] bg-white text-black shadow-2xl flex flex-col transition-transform duration-300 ease-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <span className="text-xl font-bold tracking-[0.15em] uppercase">Menu</span>
          <button onClick={closeMobileMenu} className="text-black hover:text-gray-500 transition-colors" aria-label="Close menu">
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {navLinks.map((link) => (
            <div key={link.name} className="border-b border-gray-100">
              <Link
                href={link.href}
                onClick={closeMobileMenu}
                className="flex items-center justify-between w-full py-5 text-[13px] font-bold uppercase tracking-[0.15em] hover:text-gray-500 transition-colors"
              >
                {link.name}
                <ChevronRight size={16} className="text-gray-400" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      <CartDrawer     open={isCartOpen}     onClose={() => setIsCartOpen(false)} />
      <WishlistDrawer open={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
    </>
  );
}