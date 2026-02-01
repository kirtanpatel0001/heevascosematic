'use server'

import { supabaseServer } from "@/lib/supabaseServer"; 
import { revalidatePath } from "next/cache";

// --- YOUR EXISTING SUBMIT FUNCTION (UNCHANGED) ---
export async function submitVerifiedReview(formData: FormData) {
  const supabase = await supabaseServer();
  
  const productId = formData.get("productId") as string;
  const rating = parseInt(formData.get("rating") as string);
  const comment = formData.get("comment") as string;
  
  // 1. Get User
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // 2. CHECK: Has user ALREADY reviewed this?
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .single();

  if (existingReview) {
    return { error: "You have already reviewed this product." };
  }

  // 3. SECURITY CHECK: Did they buy it & is it Delivered?
  const { data: purchaseCheck } = await supabase
    .from('order_items')
    .select('id, orders!inner(user_id, status)')
    .eq('product_id', productId)
    .eq('orders.user_id', user.id)
    .eq('orders.status', 'Delivered') 
    .limit(1);

  if (!purchaseCheck || purchaseCheck.length === 0) {
    return { error: "You can only review items that have been delivered." };
  }

  // 4. Handle Images
  const imageFiles: File[] = [];
  formData.forEach((value, key) => {
    if (key.startsWith("image-") && value instanceof File && value.size > 0) {
        imageFiles.push(value);
    }
  });

  let imageUrls: string[] = [];
  
  if (imageFiles.length > 0) {
     const uploadPromises = imageFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${productId}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from('review_images').upload(filePath, file);
        if (!uploadError) {
           const { data: { publicUrl } } = supabase.storage.from('review_images').getPublicUrl(filePath);
           return publicUrl;
        }
        return null;
     });

     const results = await Promise.all(uploadPromises);
     imageUrls = results.filter((url) => url !== null) as string[];
  }

  // 5. Insert Review
  const { error: insertError } = await supabase
    .from('reviews')
    .insert({
      user_id: user.id,
      product_id: productId,
      rating,
      comment,
      images: imageUrls
    });

  if (insertError) {
    if (insertError.code === '23505') return { error: "You have already reviewed this product." };
    return { error: "Submission failed. Please try again." };
  }

  revalidatePath(`/product/${productId}`);
  revalidatePath('/authntication/account/order'); 
  
  return { success: "Review published successfully!" };
}

// --- NEW FUNCTION: MARK HELPFUL ---
export async function markReviewAsHelpful(reviewId: string) {
  const supabase = await supabaseServer();

  // Call the SQL function created in Step 1
  const { error } = await supabase
    .rpc('increment_helpful_count', { row_id: reviewId });

  if (error) {
    console.error('Error updating helpful count:', error);
    return false;
  }

  // Refresh the page so the new count shows up for everyone
  revalidatePath('/product/[id]'); 
  return true;
}