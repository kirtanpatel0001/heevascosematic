import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getStaticSupabase } from "@/lib/supabaseStatic"; 
import { ChevronRight } from "lucide-react";
import { Playfair_Display, Montserrat } from "next/font/google";
import GalleryClient from "@/components/GalleryClient"; 
import ProductInfo from "@/components/ProductInfo"; 
import ReviewsSection from "@/components/ReviewsSection"; 
import { Toaster } from "sonner"; 

const playfair = Playfair_Display({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });

// Force dynamic rendering so reviews are always fresh/real-time
export const revalidate = 0; 

export async function generateStaticParams() {
  const supabase = getStaticSupabase();
  const { data: products } = await supabase.from('products').select('id');
  if (!products) return [];
  return products.map((product) => ({ id: product.id.toString() }));
}

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const supabase = getStaticSupabase();

  // 1. Fetch Current Product
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !product) return notFound();

  // 2. Fetch Related Products
  let { data: relatedProducts } = await supabase
    .from('products')
    .select('id, name, price, image_url, category')
    .eq('category', product.category)
    .neq('id', product.id);

  if (!relatedProducts || relatedProducts.length === 0) {
    const { data: allProducts } = await supabase
      .from('products')
      .select('id, name, price, image_url, category')
      .neq('id', product.id)
      .limit(8); 
    relatedProducts = allProducts || [];
  }

  // 3. FETCH REVIEWS & CALCULATE STATS
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', id)
    .order('created_at', { ascending: false });

  // --- CALCULATION LOGIC ---
  const totalReviews = reviews?.length || 0;
  
  // Calculate Average (e.g., 4.8)
  const averageRating = totalReviews > 0
    ? reviews!.reduce((acc, review) => acc + review.rating, 0) / totalReviews
    : 0;
    
  // Format formatted (e.g. "4.8") to ensure no long decimals
  const formattedRating = Number(averageRating.toFixed(1));

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  const galleryImages = product.images && product.images.length > 0 
    ? product.images 
    : (product.image_url ? [product.image_url] : []);

  return (
    <div className={`min-h-screen bg-white ${montserrat.className} text-zinc-900 pb-20`}>
      <Toaster position="top-center" richColors />

      {/* --- HEADER --- */}
      <div className="w-full border-b border-zinc-200 bg-white">
        <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold flex items-center gap-2">
            <Link href="/" className="hover:text-black transition-colors">Home</Link>
            <ChevronRight size={10} />
            <Link href="/authntication/shop" className="hover:text-black transition-colors">Shop</Link>
            <ChevronRight size={10} />
            <span className="text-black line-clamp-1 font-bold">{product.name}</span>
          </p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-0 md:px-8 py-0 md:py-10">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-0 lg:gap-20 items-start">
          
          {/* LEFT: GALLERY */}
          <div className="w-full lg:col-span-7 relative z-0 mb-8 lg:mb-0 lg:sticky lg:top-10">
            <GalleryClient images={galleryImages} name={product.name} />
          </div>

          {/* RIGHT: DETAILS */}
          <div className="w-full lg:col-span-5 px-6 md:px-0">
             {/* Pass Calculated Stats to ProductInfo */}
             <ProductInfo 
                product={product} 
                ratingStats={{ average: formattedRating, count: totalReviews }} 
             />
          </div>
        </div>

        {/* --- DIVIDER --- */}
        <div className="w-full h-px bg-zinc-200 my-16 md:my-24 px-6 mx-auto"></div>

        {/* --- REVIEWS SECTION --- */}
        {/* Pass raw reviews, the component handles the progress bars internally */}
        <ReviewsSection productId={product.id} reviews={reviews || []} />

        {/* --- DIVIDER --- */}
        <div className="w-full h-px bg-zinc-200 my-16 md:my-24 px-6 mx-auto"></div>

        {/* --- RELATED PRODUCTS --- */}
        {relatedProducts && relatedProducts.length > 0 ? (
          <div className="w-full px-6 md:px-0">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
               <div>
                 <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2 block">
                   You might also like
                 </span>
                 <h2 className={`${playfair.className} text-2xl md:text-4xl text-black`}>
                   Complete The Ritual
                 </h2>
               </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12">
               {relatedProducts.map((item: any) => (
                  <Link href={`/product/${item.id}`} key={item.id} className="group cursor-pointer flex flex-col h-full">
                     <div className="relative aspect-[3/4] bg-transparent overflow-hidden mb-5 rounded-lg">
                        {item.image_url ? (
                           <Image 
                              src={item.image_url} 
                              alt={item.name} 
                              fill 
                              className="object-contain p-0 transition-transform duration-700 group-hover:scale-105" 
                              unoptimized={true}
                           />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-zinc-300 bg-zinc-50">
                             <span className="text-[10px] uppercase">No Image</span>
                           </div>
                        )}
                     </div>
                     <div className="text-left flex flex-col flex-grow">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
                           {item.category}
                        </span>
                        <h3 className={`${playfair.className} text-[17px] font-bold text-black leading-tight mb-2 group-hover:underline decoration-1 underline-offset-4`}>
                           {item.name}
                        </h3>
                        <p className="text-sm font-semibold text-zinc-900 mt-auto pt-1">
                           {formatPrice(item.price)}
                        </p>
                     </div>
                  </Link>
               ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-zinc-400 text-sm">
            No related products found 
          </div>
        )}
      </div>
    </div>
  );
}