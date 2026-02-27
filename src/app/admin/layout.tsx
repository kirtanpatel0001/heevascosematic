export const runtime = 'nodejs';

import { requireAdmin } from '@/lib/requireAdmin';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import {
  LayoutDashboard, ShoppingBag, Package, Users,
  Settings, LogOut, Store, Ticket, UserCog
} from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  const signOut = async () => {
    'use server';
    const supabase = await supabaseServer();
    await supabase.auth.signOut();
    redirect('/');
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans flex">

      {/* SIDEBAR */}
      <aside className="w-64 bg-black text-white p-6 flex flex-col justify-between hidden md:flex sticky top-0 h-screen border-r border-zinc-800">

        {/* BRAND */}
        <div>
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="h-9 w-9 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">H.</span>
            </div>
            <div>
              <h2 className="text-lg font-bold leading-none">Heevas</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Admin Panel</p>
            </div>
          </div>

          {/* NAV */}
          <nav className="space-y-1.5">
            {[
              { href: '/admin/dashboard', Icon: LayoutDashboard, label: 'Dashboard' },
              { href: '/admin/pos', Icon: Store, label: 'POS Terminal' },
              { href: '/admin/orders', Icon: ShoppingBag, label: 'Orders' },
              { href: '/admin/coupons', Icon: Ticket, label: 'Coupons' },
              { href: '/admin/products', Icon: Package, label: 'Products' },
              { href: '/admin/customers', Icon: Users, label: 'Customers' },
              { href: '/admin/staff', Icon: UserCog, label: 'Staff' },
              { href: '/admin/settings', Icon: Settings, label: 'Settings' },
            ].map(({ href, Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* LOGOUT */}
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

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}