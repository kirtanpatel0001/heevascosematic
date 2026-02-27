import { Suspense } from 'react';
import { getStaticSupabase } from '@/lib/supabaseStatic';
import { supabaseServer } from '@/lib/supabaseServer';
import ShopContent from './ShopContent';
import { Loader2 } from 'lucide-react';

export const revalidate = 60;

export default async function ShopPage() {
  const supabaseStatic = getStaticSupabase();
  const supabaseAuth = await supabaseServer();

  const [productsRes, userRes] = await Promise.all([
    supabaseStatic
      .from('products')
      .select('*')
      .eq('is_visible', true) // ✅ Fixed: only fetch visible products
      .order('created_at', { ascending: false }),
    supabaseAuth.auth.getUser()
  ]);

  const products = productsRes.data || [];
  const user = userRes.data.user;

  let wishlistIds: string[] = [];
  if (user) {
    const { data: wishlistData } = await supabaseAuth
      .from('wishlist_items')
      .select('product_id')
      .eq('user_id', user.id);

    if (wishlistData) {
      wishlistIds = wishlistData.map((item) => item.product_id);
    }
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-200" size={32} />
      </div>
    }>
      <ShopContent
        initialProducts={products}
        initialWishlist={wishlistIds}
        userId={user?.id || null}
      />
    </Suspense>
  );
}