import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getStaticSupabase } from "@/lib/supabaseStatic"; 
import { ChevronRight } from "lucide-react";
import { Playfair_Display, Montserrat } from "next/font/google";

// Components
import GalleryClient from "@/components/GalleryClient"; 
import ProductInfo from "@/components/ProductInfo"; 
import ReviewsSection from "@/components/ReviewsSection"; 
import BeforeAfterSlider from "@/components/BeforeAfterSlider"; 
import ProductTabs from "@/components/ProductTabs"; 
import { Toaster } from "sonner"; 

const playfair = Playfair_Display({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });

// Force dynamic rendering so reviews/stock are always fresh
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

  const totalReviews = reviews?.length || 0;
  const averageRating = totalReviews > 0
    ? reviews!.reduce((acc, review) => acc + review.rating, 0) / totalReviews
    : 0;
  const formattedRating = Number(averageRating.toFixed(1));

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  const galleryImages = product.images && product.images.length > 0 
    ? product.images 
    : (product.image_url ? [product.image_url] : []);

  // --- PREPARE DATA FOR SECTIONS ---
  
  // A. Usage Steps (How to Use) - Ensure array safety
  const usageSteps = Array.isArray(product.usage_steps) ? product.usage_steps : [];
  
  // B. Before/After Visibility - Only show if both exist
  const showBeforeAfter = product.before_image && product.after_image;

  // C. Tab Data (The new dynamic part)
  const tabData = {
    description: product.description || "",
    ingredients: product.ingredients || "",
    
    // Pass the comparison arrays (Default to empty array if null to fix crash)
    whyChooseData: Array.isArray(product.why_choose_data) ? product.why_choose_data : [],
    additionalInfoData: Array.isArray(product.additional_info_data) ? product.additional_info_data : [],
    
    // Pass Comparison Images (Fall back to main image for "Our Product" if specific one not uploaded)
    productImage: product.comparison_our_image || product.image_url, 
    otherImage: product.comparison_other_image || null,
    
    // Pass Info Tab Image
    additionalInfoImage: product.additional_info_image || null
  };

  return (
    <div className={`min-h-screen bg-white ${montserrat.className} text-zinc-900 pb-20 overflow-x-hidden`}>
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

      {/* --- MAIN HERO SECTION --- */}
      <div className="max-w-[1440px] mx-auto px-0 md:px-8 py-0 md:py-10">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-0 lg:gap-20 items-start">
          
          {/* LEFT: GALLERY */}
          <div className="w-full lg:col-span-7 relative z-0 mb-8 lg:mb-0 lg:sticky lg:top-10">
            <GalleryClient images={galleryImages} name={product.name} />
          </div>

          {/* RIGHT: DETAILS */}
          <div className="w-full lg:col-span-5 px-6 md:px-0">
             <ProductInfo 
                product={product} 
                ratingStats={{ average: formattedRating, count: totalReviews }} 
             />
          </div>
        </div>
      </div>

      {/* --- SECTION: PRODUCT TABS (Dynamic Description, Comparison, Info) --- */}
      <ProductTabs {...tabData} />

      {/* --- SECTION: HOW TO USE (Dynamic) --- */}
      {/* Only render if we have steps added in Admin */}
      {usageSteps.length > 0 && usageSteps[0]?.title && (
        <div className="w-full bg-zinc-50 py-16 md:py-24 my-10 border-t border-zinc-100">
            <div className="max-w-[1440px] mx-auto px-6">
                <div className="text-center mb-12">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3 block">
                    Ritual
                    </span>
                    <h2 className={`${playfair.className} text-3xl md:text-4xl text-black`}>
                        How to Use
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    {usageSteps.map((step: any, index: number) => (
                        <div key={index} className="flex flex-col items-center text-center group">
                            {/* Step Image */}
                            <div className="relative w-full aspect-square md:aspect-[4/5] overflow-hidden rounded-lg mb-6 shadow-sm bg-white border border-zinc-100">
                                {step.image ? (
                                    <Image 
                                        src={step.image} 
                                        alt={step.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        unoptimized={true}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-50 text-zinc-300">
                                        <span className="text-[10px] uppercase font-bold tracking-widest">No Image</span>
                                    </div>
                                )}
                                
                                <div className="absolute inset-0 bg-black/5" />
                                {/* Step Number Badge */}
                                <div className="absolute top-4 left-4 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-xs font-bold font-serif shadow-sm">
                                    {index + 1}
                                </div>
                            </div>

                            {/* Step Text */}
                            <h3 className={`${playfair.className} text-xl font-bold mb-2`}>{step.title}</h3>
                            <p className="text-zinc-600 text-sm leading-relaxed max-w-[250px]">
                                {step.text}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* --- SECTION: BEFORE & AFTER SLIDER (Dynamic) --- */}
      {/* Only render if BOTH images are uploaded in Admin */}
      {showBeforeAfter && (
          <div className="max-w-[1440px] mx-auto px-6 mb-20">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left Side: Text */}
                <div className="order-2 lg:order-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3 block">
                       Real Results
                    </span>
                    <h2 className={`${playfair.className} text-3xl md:text-4xl text-black mb-6`}>
                        Transformation You Can See
                    </h2>
                    <p className="text-zinc-600 leading-relaxed mb-8">
                        See the difference after just one wash. Our formula is designed to restore balance, 
                        add shine, and improve texture instantly without weighing hair down.
                    </p>
                    <div className="flex gap-8">
                         <div>
                            <h4 className={`${playfair.className} text-2xl font-bold`}>95%</h4>
                            <p className="text-xs uppercase tracking-wider text-zinc-500 mt-1">Saw More Shine</p>
                         </div>
                         <div>
                            <h4 className={`${playfair.className} text-2xl font-bold`}>92%</h4>
                            <p className="text-xs uppercase tracking-wider text-zinc-500 mt-1">Felt Softer Hair</p>
                         </div>
                    </div>
                </div>

                {/* Right Side: Slider */}
                <div className="order-1 lg:order-2 w-full h-full flex items-center justify-center">
                    <div className="w-full max-w-xl shadow-2xl rounded-lg">
                        <BeforeAfterSlider 
                            beforeImage={product.before_image} 
                            afterImage={product.after_image} 
                        />
                    </div>
                </div>
             </div>
          </div>
      )}

      {/* --- DIVIDER --- */}
      <div className="w-full h-px bg-zinc-200 my-16 md:my-24 px-6 mx-auto"></div>

      {/* --- REVIEWS SECTION --- */}
      <ReviewsSection productId={product.id} reviews={reviews || []} />

      {/* --- DIVIDER --- */}
      <div className="w-full h-px bg-zinc-200 my-16 md:my-24 px-6 mx-auto"></div>

      {/* --- RELATED PRODUCTS --- */}
      {relatedProducts && relatedProducts.length > 0 ? (
        <div className="max-w-[1440px] mx-auto px-6 md:px-8 mb-20">
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
      ) : null}
    </div>
  );
}