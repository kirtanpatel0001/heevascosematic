import { Suspense } from 'react';
import { getStaticSupabase } from "@/lib/supabaseStatic"; 
import { supabaseServer } from "@/lib/supabaseServer"; // Import the cookie-aware client
import ShopContent from './ShopContent'; 
import { Loader2 } from 'lucide-react';

// You can keep revalidate, but since we use cookies now, Next.js might switch to dynamic rendering for the user part.
export const revalidate = 60; 

export default async function ShopPage() {
  // 1. Setup Clients
  const supabaseStatic = getStaticSupabase(); // Fast, no cookies (For Products)
  const supabaseAuth = await supabaseServer(); // Slower, reads cookies (For User)

  // 2. Fetch Data in Parallel
  const [productsRes, userRes] = await Promise.all([
    // Fetch products using the Static client (Fast)
    supabaseStatic.from('products').select('*').order('created_at', { ascending: false }),
    
    // Fetch User using the Server client (Cookie-aware)
    supabaseAuth.auth.getUser()
  ]);

  const products = productsRes.data || [];
  const user = userRes.data.user;

  // 3. Fetch Wishlist (Only if user is found)
  let wishlistIds: string[] = [];
  if (user) {
    // We can use supabaseAuth here to ensure RLS policies work if you have them
    const { data: wishlistData } = await supabaseAuth
      .from('wishlist_items')
      .select('product_id')
      .eq('user_id', user.id);
    
    if (wishlistData) {
      wishlistIds = wishlistData.map((item) => item.product_id);
    }
  }

  // 4. Pass data to Client
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