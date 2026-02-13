import { getStaticSupabase } from "@/lib/supabaseStatic";
import HeevasHeroSection from "./Home/HeevasHero";
import HeevasCareSection from "./Home/HeevasCare";
import HeevasFeaturesSection from "./Home/HeevasFeatures";
import HeevasProduct from "./Home/HeevasProduct"; // This is your Client Component
import HeevasUseingSection from "./Home/HeevasUseing";
import ShopByConcern from "./Home/ShopByConcern";
import TrustBar from "./Home/TrustBar";

// Refresh data every 60 seconds
export const revalidate = 60;

export default async function Home() {
  const supabase = getStaticSupabase();

  // 1. Fetch Products
  const { data: rawProducts } = await supabase
    .from("products")
    .select("id, name, category, price, image_url, status, show_on_home")
    .eq('show_on_home', true)
    .order("created_at", { ascending: false })
    .limit(4);

  // 2. Fetch User (to check wishlist)
  const { data: { user } } = await supabase.auth.getUser();

  // 3. Calculate Real Ratings (Fetch reviews for each product)
  const productsWithStats = await Promise.all(
    (rawProducts || []).map(async (product) => {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', product.id);

      const total = reviews?.length || 0;
      const avg = total > 0 ? reviews!.reduce((a, b) => a + b.rating, 0) / total : 0;
      
      return { 
        ...product, 
        avg_rating: avg, 
        total_reviews: total 
      };
    })
  );

  // 4. Get User's Wishlist (if logged in)
  let wishlistIds: string[] = [];
  if (user) {
    const { data: wish } = await supabase
      .from("wishlist_items")
      .select("product_id")
      .eq("user_id", user.id);
      
    if (wish) {
      wishlistIds = wish.map((w) => w.product_id);
    }
  }

  return (
    <div>
      <HeevasHeroSection />
      <TrustBar />
      <ShopByConcern />
      
      {/* PASS THE DATA HERE to fix the "map of undefined" error */}
      <HeevasProduct 
        initialProducts={productsWithStats} 
        initialWishlist={wishlistIds} 
      />
      
      <HeevasFeaturesSection />
      <HeevasUseingSection />
      <HeevasCareSection />
    </div>
  );
}