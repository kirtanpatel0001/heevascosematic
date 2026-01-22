export const runtime = 'nodejs';

import { requireAdmin } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Settings,
  LogOut,
  Store, // <--- Imported Store Icon
} from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🔒 SERVER-SIDE SECURITY
  await requireAdmin();

  // 🚪 LOGOUT ACTION
  const signOut = async () => {
    'use server';
    const supabase = await supabaseServer();
    await supabase.auth.signOut();
    redirect('/');
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans flex">
      
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-black text-white p-6 flex flex-col justify-between hidden md:flex sticky top-0 h-screen border-r border-zinc-800">
        
        {/* ---------- BRAND ---------- */}
        <div>
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="h-9 w-9 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">H.</span>
            </div>
            <div>
              <h2 className="text-lg font-bold leading-none">Heevas</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                Admin Panel
              </p>
            </div>
          </div>

          {/* ---------- NAVIGATION ---------- */}
          <nav className="space-y-1.5">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>

            <Link
              href="/admin/pos"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Store size={18} /> {/* <--- POS Link Added Here */}
              POS Terminal
            </Link>

            <Link
              href="/admin/orders"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <ShoppingBag size={18} />
              Orders
            </Link>

            <Link
              href="/admin/products"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Package size={18} />
              Products
            </Link>

            <Link
              href="/admin/customers"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Users size={18} />
              Customers
            </Link>

            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Settings size={18} />
              Settings
            </Link>
          </nav>
        </div>

        {/* ---------- LOGOUT (REAL ACTION) ---------- */}
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </form>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 overflow-y-auto h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}