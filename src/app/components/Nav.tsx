'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image'; 
import { 
  Search, 
  User, 
  Heart, 
  ShoppingBag, 
  Menu, 
  X, 
  ChevronRight,
  // ChevronDown is no longer needed
} from 'lucide-react';
import CartDrawer from './CartDrawer';
import WishlistDrawer from './WishlistDrawer';
import { supabaseClient } from '@/lib/supabaseClient';

export default function Header() {
  const supabase = supabaseClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
  }, [isMobileMenuOpen]);

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    }
    if (isUserMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  // Fetch current user and listen for auth changes
  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(data.user ?? null);
      } catch (err) {
        console.error('Failed to get user', err);
      }
    }
    loadUser();

    const { data: sub } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setIsUserMenuOpen(false);
    setUser(null);
  }

  // UPDATED: "Company" and its dropdown structure have been removed
  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/authntication/shop' },
    { name: 'About Us', href: '/pages/about' },
    { name: 'Contact Us', href: '/pages/contact' },
  ];

  return (
    <>
      {/* =======================
          HEADER (Desktop & Mobile)
      ======================== */}
      <nav className="sticky top-0 w-full z-40 bg-[#C4B4AE] border-b border-gray-200 shadow-sm font-sans text-black">
        <div className="max-w-[1920px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          
          {/* 1. BRAND LOGO - FIXED & SHARP */}
          <Link href="/" className="flex items-center shrink-0">
            <Image 
              src="/LOGO/bg34.png" 
              alt="Brand Logo"
              width={600} 
              height={800}
              className="h-60 md:h-60 w-auto object-contain" 
              quality={100} 
              priority 
            />
          </Link>

          {/* 2. DESKTOP NAVIGATION (Hidden on Mobile) */}
          <div className="hidden md:flex items-center space-x-12 h-full">
            {navLinks.map((link) => (
              <div key={link.name} className="relative group h-full flex items-center">
                <Link 
                  href={link.href} 
                  className="text-[13px] font-bold uppercase tracking-[0.15em] text-gray-800 hover:text-black transition-colors flex items-center gap-1"
                >
                  {link.name}
                </Link>
                {/* Dropdown rendering logic removed since no links use it anymore */}
              </div>
            ))}
          </div>

          {/* 3. ICONS AREA */}
          <div className="flex items-center gap-3 md:gap-8">
            
            {/* DESKTOP ONLY Icons (Just Search now) */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/search" className="hover:text-gray-600 transition-colors">
                <Search size={20} strokeWidth={1.5} />
              </Link>
            </div>

            {/* QUICK ACCESS ICONS (Visible on Mobile & Desktop: User, Wishlist, Cart) */}
            <div className="flex items-center gap-4 md:gap-6">
              
              {/* User Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="hover:text-gray-600 transition-colors flex items-center gap-2"
                  aria-label="User menu"
                  type="button"
                >
                  {user?.user_metadata?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.user_metadata.avatar_url} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
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
                        <Link href="/authntication/account/order" className="text-sm font-medium py-2 px-2 hover:bg-gray-50">Orders</Link>
                        <button onClick={handleSignOut} className="text-sm text-left font-medium py-2 px-2 hover:bg-gray-50">Logout</button>
                      </>
                    ) : (
                      <>
                        <Link href="/auth/login" className="text-sm font-medium py-2 px-2 hover:bg-gray-50">Login</Link>
                        <Link href="/auth/signup" className="text-sm font-medium py-2 px-2 hover:bg-gray-50">Signup</Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* WISHLIST */}
              <button 
                onClick={() => setIsWishlistOpen(true)} 
                className="hover:text-gray-600 transition-colors relative" 
                aria-label="Open wishlist"
              >
                <Heart size={22} strokeWidth={1.5} />
              </button>

              {/* CART */}
              <button 
                onClick={() => setIsCartOpen(true)} 
                className="hover:text-gray-600 transition-colors relative" 
                aria-label="Open cart"
              >
                <ShoppingBag size={22} strokeWidth={1.5} />
              </button>
            </div>

            {/* 4. MOBILE HAMBURGER BUTTON */}
            <button 
              className="md:hidden p-2 -mr-2 text-black hover:bg-black/10 rounded-full transition-colors" 
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open Menu"
            >
              <Menu size={26} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </nav>

      {/* =======================
          MOBILE SIDE DRAWER 
      ======================== */}
      
      {/* Dark Overlay (Backdrop) */}
      <div 
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sliding Drawer */}
      <div 
        className={`fixed top-0 left-0 bottom-0 z-50 w-[85%] max-w-[360px] bg-white text-black shadow-2xl flex flex-col transition-transform duration-300 ease-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header: Close Button */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <span className="text-xl font-bold tracking-[0.15em] uppercase text-black">Menu</span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-black hover:text-gray-500 transition-colors">
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        {/* Drawer Body: Navigation Links */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col">
            {navLinks.map((link) => (
              <div key={link.name} className="border-b border-gray-100">
                <Link 
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between w-full py-5 text-[13px] font-bold uppercase tracking-[0.15em] hover:text-gray-500 transition-colors"
                >
                  {link.name}
                  <ChevronRight size={16} className="text-gray-400" />
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
      {/* Drawers for cart and wishlist */}
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <WishlistDrawer open={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
    </>
  );
}














// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import Link from 'next/link';
// import Image from 'next/image'; 
// import { 
//   Search, 
//   User, 
//   Heart, 
//   ShoppingBag, 
//   Menu, 
//   X, 
//   ChevronRight, 
//   ChevronDown 
// } from 'lucide-react';
// import CartDrawer from './CartDrawer';
// import WishlistDrawer from './WishlistDrawer';
// import { supabaseClient } from '@/lib/supabaseClient';

// export default function Header() {
//   const supabase = supabaseClient();
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [isCompanyMobileOpen, setIsCompanyMobileOpen] = useState(false);
//   const [isCartOpen, setIsCartOpen] = useState(false);
//   const [isWishlistOpen, setIsWishlistOpen] = useState(false);
//   const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
//   const [user, setUser] = useState<any | null>(null);
//   const userMenuRef = useRef<HTMLDivElement | null>(null);

//   // Lock body scroll when mobile menu is open
//   useEffect(() => {
//     document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
//   }, [isMobileMenuOpen]);

//   // Close user menu on outside click
//   useEffect(() => {
//     function handleClickOutside(e: MouseEvent) {
//       const target = e.target as Node;
//       if (!userMenuRef.current) return;
//       if (!userMenuRef.current.contains(target)) {
//         setIsUserMenuOpen(false);
//       }
//     }
//     if (isUserMenuOpen) document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, [isUserMenuOpen]);

//   // Fetch current user and listen for auth changes
//   useEffect(() => {
//     let mounted = true;
//     async function loadUser() {
//       try {
//         const { data } = await supabase.auth.getUser();
//         if (!mounted) return;
//         setUser(data.user ?? null);
//       } catch (err) {
//         console.error('Failed to get user', err);
//       }
//     }
//     loadUser();

//     const { data: sub } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
//   setUser(session?.user ?? null);
// });

//     return () => {
//       mounted = false;
//       sub.subscription.unsubscribe();
//     };
//   }, []);

//   async function handleSignOut() {
//     await supabase.auth.signOut();
//     setIsUserMenuOpen(false);
//     setUser(null);
//   }

//   const navLinks = [
//     { name: 'Home', href: '/' },
//     { name: 'Shop', href: '/authntication/shop' },
//     { name: 'About Us', href: '/pages/about' },
//     { 
//       name: 'Company', 
//       href: '#', 
//       hasDropdown: true, 
//       subItems: [
//         { name: 'Blog', href: '/blog' },
//         { name: 'Our Story', href: '/story' }
//       ] 
//     },
//     { name: 'Contact Us', href: '/pages/contact' },
//   ];

//   return (
//     <>
//       {/* =======================
//           HEADER (Desktop & Mobile)
//       ======================== */}
//       <nav className="sticky top-0 w-full z-40 bg-[#C4B4AE] border-b border-gray-200 shadow-sm font-sans text-black">
//         <div className="max-w-[1920px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          
//           {/* 1. BRAND LOGO - FIXED & SHARP */}
//           <Link href="/" className="flex items-center shrink-0">
//             <Image 
//               src="/LOGO/bg34.png" 
//               alt="Brand Logo"
//               width={600} 
//               height={800}
//               className="h-60 md:h-60 w-auto object-contain" 
//               quality={100} 
//               priority 
//             />
//           </Link>

//           {/* 2. DESKTOP NAVIGATION (Hidden on Mobile) */}
//           <div className="hidden md:flex items-center space-x-12 h-full">
//             {navLinks.map((link) => (
//               <div key={link.name} className="relative group h-full flex items-center">
//                 <Link 
//                   href={link.href} 
//                   className="text-[13px] font-bold uppercase tracking-[0.15em] text-gray-800 hover:text-black transition-colors flex items-center gap-1"
//                 >
//                   {link.name}
//                   {link.hasDropdown && <ChevronDown size={14} className="text-gray-400 group-hover:text-black transition-colors" />}
//                 </Link>

//                 {/* Desktop Dropdown Panel */}
//                 {link.hasDropdown && (
//                   <div className="absolute left-1/2 -translate-x-1/2 top-full w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out pt-0">
//                     <div className="bg-white border border-gray-100 shadow-xl p-4 flex flex-col gap-3 mt-[-1px]">
//                       {link.subItems?.map((sub) => (
//                         <Link 
//                           key={sub.name} 
//                           href={sub.href} 
//                           className="text-[11px] font-bold text-gray-500 hover:text-black uppercase tracking-[0.15em] transition-colors block border-l-2 border-transparent hover:border-black pl-3"
//                         >
//                           {sub.name}
//                         </Link>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>

//           {/* 3. ICONS AREA */}
//           <div className="flex items-center gap-3 md:gap-8">
            
//             {/* DESKTOP ONLY Icons (Just Search now) */}
//             <div className="hidden md:flex items-center gap-6">
//               <Link href="/search" className="hover:text-gray-600 transition-colors">
//                 <Search size={20} strokeWidth={1.5} />
//               </Link>
//             </div>

//             {/* QUICK ACCESS ICONS (Visible on Mobile & Desktop: User, Wishlist, Cart) */}
//             <div className="flex items-center gap-4 md:gap-6">
              
//               {/* User Dropdown */}
//               <div className="relative" ref={userMenuRef}>
//                 <button
//                   onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
//                   className="hover:text-gray-600 transition-colors flex items-center gap-2"
//                   aria-label="User menu"
//                   type="button"
//                 >
//                   {user?.user_metadata?.avatar_url ? (
//                     // eslint-disable-next-line @next/next/no-img-element
//                     <img src={user.user_metadata.avatar_url} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
//                   ) : user?.email ? (
//                     <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
//                       {user.email.charAt(0).toUpperCase()}
//                     </div>
//                   ) : (
//                     <User size={22} strokeWidth={1.5} />
//                   )}
//                 </button>

//                 {isUserMenuOpen && (
//                   <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 shadow-lg rounded p-2 flex flex-col z-50">
//                     {user ? (
//                       <>
//                         <div className="px-2 py-2 border-b border-gray-100">
//                           <div className="text-sm font-semibold">{user.user_metadata?.full_name ?? user.email}</div>
//                           <div className="text-xs text-gray-500 truncate">{user.email}</div>
//                         </div>
//                         <Link href="/authntication/account/profile" className="text-sm font-medium py-2 px-2 hover:bg-gray-50">Profile</Link>
//                         <Link href="/authntication/account/order" className="text-sm font-medium py-2 px-2 hover:bg-gray-50">Orders</Link>
//                         <button onClick={handleSignOut} className="text-sm text-left font-medium py-2 px-2 hover:bg-gray-50">Logout</button>
//                       </>
//                     ) : (
//                       <>
//                         <Link href="/auth/login" className="text-sm font-medium py-2 px-2 hover:bg-gray-50">Login</Link>
//                         <Link href="/auth/signup" className="text-sm font-medium py-2 px-2 hover:bg-gray-50">Signup</Link>
//                       </>
//                     )}
//                   </div>
//                 )}
//               </div>

//               {/* WISHLIST (Moved here to be visible on Mobile and beside Cart) */}
//               <button 
//                 onClick={() => setIsWishlistOpen(true)} 
//                 className="hover:text-gray-600 transition-colors relative" 
//                 aria-label="Open wishlist"
//               >
//                 <Heart size={22} strokeWidth={1.5} />
//               </button>

//               {/* CART */}
//               <button 
//                 onClick={() => setIsCartOpen(true)} 
//                 className="hover:text-gray-600 transition-colors relative" 
//                 aria-label="Open cart"
//               >
//                 <ShoppingBag size={22} strokeWidth={1.5} />
//               </button>
//             </div>

//             {/* 4. MOBILE HAMBURGER BUTTON */}
//             <button 
//               className="md:hidden p-2 -mr-2 text-black hover:bg-black/10 rounded-full transition-colors" 
//               onClick={() => setIsMobileMenuOpen(true)}
//               aria-label="Open Menu"
//             >
//               <Menu size={26} strokeWidth={1.5} />
//             </button>
//           </div>
//         </div>
//       </nav>

//       {/* =======================
//           MOBILE SIDE DRAWER 
//       ======================== */}
      
//       {/* Dark Overlay (Backdrop) */}
//       <div 
//         className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
//           isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
//         }`}
//         onClick={() => setIsMobileMenuOpen(false)}
//       />

//       {/* Sliding Drawer */}
//       <div 
//         className={`fixed top-0 left-0 bottom-0 z-50 w-[85%] max-w-[360px] bg-white text-black shadow-2xl flex flex-col transition-transform duration-300 ease-out md:hidden ${
//           isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
//         }`}
//       >
//         {/* Drawer Header: Close Button */}
//         <div className="flex justify-between items-center p-6 border-b border-gray-100">
//             <span className="text-xl font-bold tracking-[0.15em] uppercase text-black">Menu</span>
//           <button onClick={() => setIsMobileMenuOpen(false)} className="text-black hover:text-gray-500 transition-colors">
//             <X size={24} strokeWidth={1.5} />
//           </button>
//         </div>

//         {/* Drawer Body: Navigation Links */}
//         <div className="flex-1 overflow-y-auto px-6 py-4">
//           <div className="flex flex-col">
//             {navLinks.map((link) => (
//               <div key={link.name} className="border-b border-gray-100">
//                 {link.hasDropdown ? (
//                   // DROPDOWN LINK (Mobile Accordion)
//                   <div>
//                     <button 
//                       onClick={() => setIsCompanyMobileOpen(!isCompanyMobileOpen)}
//                       className="flex items-center justify-between w-full py-5 text-[13px] font-bold uppercase tracking-[0.15em] hover:text-gray-500 transition-colors"
//                     >
//                       {link.name}
//                       <ChevronRight 
//                         size={16} 
//                         className={`text-gray-400 transition-transform duration-300 ${isCompanyMobileOpen ? 'rotate-90' : ''}`}
//                       />
//                     </button>
                    
//                     {/* Submenu Expansion */}
//                     <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCompanyMobileOpen ? 'max-h-40 opacity-100 pb-5' : 'max-h-0 opacity-0'}`}>
//                       <div className="flex flex-col gap-4 pl-4 border-l-2 border-gray-100 ml-1">
//                         {link.subItems?.map((sub) => (
//                           <Link 
//                             key={sub.name} 
//                             href={sub.href}
//                             onClick={() => setIsMobileMenuOpen(false)}
//                             className="text-[11px] font-medium text-gray-500 uppercase tracking-[0.15em] hover:text-black transition-colors block"
//                           >
//                             {sub.name}
//                           </Link>
//                         ))}
//                       </div>
//                     </div>
//                   </div>
//                 ) : (
//                   // REGULAR LINK
//                   <Link 
//                     href={link.href}
//                     onClick={() => setIsMobileMenuOpen(false)}
//                     className="flex items-center justify-between w-full py-5 text-[13px] font-bold uppercase tracking-[0.15em] hover:text-gray-500 transition-colors"
//                   >
//                     {link.name}
//                     <ChevronRight size={16} className="text-gray-400" />
//                   </Link>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Drawer Footer: Bottom Utility Bar */}
       

//       </div>
//       {/* Drawers for cart and wishlist */}
//       <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
//       <WishlistDrawer open={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
//     </>
//   );
// }