'use client';

import { useState, useMemo } from "react";
import Image from "next/image";
import { markReviewAsHelpful } from "@/app/actions/review-actions"; 
import { 
  Star, 
  CheckCircle, 
  ThumbsUp, 
  ChevronDown 
} from "lucide-react";

// --- Types ---
interface Review {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  title?: string;
  comment: string;
  created_at: string;
  images?: string[];
  helpful_count?: number; 
}

// 👇 FIXED: Added productId to the interface
interface ReviewsSectionProps {
  reviews: Review[];
  productId: string; 
}

type SortOption = 'helpful' | 'newest' | 'highest' | 'lowest';

// 👇 FIXED: Added productId to the component props
export default function ReviewsSection({ reviews = [], productId }: ReviewsSectionProps) {
  
  // State for sorting & pagination
  const [sortBy, setSortBy] = useState<SortOption>('helpful');
  const [visibleCount, setVisibleCount] = useState(5);
  
  // State for local helpful tracking (Optimistic UI)
  const [helpfulUpdates, setHelpfulUpdates] = useState<Record<string, number>>({});
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());

  // --- Logic: Handle Helpful Click ---
  const handleHelpfulClick = async (reviewId: string, currentCount: number) => {
    // Prevent double liking in same session
    if (likedReviews.has(reviewId)) return;

    // 1. Optimistic Update (Update UI instantly)
    const newCount = (currentCount || 0) + 1;
    setHelpfulUpdates(prev => ({ ...prev, [reviewId]: newCount }));
    setLikedReviews(prev => new Set(prev).add(reviewId));

    // 2. Call Backend (Real Server Action)
    try {
        await markReviewAsHelpful(reviewId);
    } catch (error) {
      console.error("Failed to update helpful count", error);
    }
  };

  // --- Logic: Calculate Stats ---
  const stats = useMemo(() => {
    const total = reviews.length;
    if (!total) return { avg: 0, total, distribution: [0,0,0,0,0] };

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = sum / total;

    const distribution = Array(5).fill(0);
    reviews.forEach((r) => {
      const rating = Math.min(Math.max(r.rating, 1), 5);
      const index = Math.floor(rating) - 1;
      if (index >= 0 && index < 5) distribution[index]++;
    });

    return { 
      avg: Number(avg.toFixed(1)), 
      total, 
      distribution: distribution.reverse() 
    };
  }, [reviews]);

  // --- Logic: Sort & Filter ---
  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];

    switch (sortBy) {
      case 'helpful':
        // Sort using the LIVE updated counts
        return sorted.sort((a, b) => {
          const countA = helpfulUpdates[a.id] ?? (a.helpful_count || 0);
          const countB = helpfulUpdates[b.id] ?? (b.helpful_count || 0);
          return countB - countA;
        });
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'highest':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'lowest':
        return sorted.sort((a, b) => a.rating - b.rating);
      default:
        return sorted;
    }
  }, [reviews, sortBy, helpfulUpdates]);

  const displayedReviews = sortedReviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  const renderStars = (rating: number, size = 16) => (
    <div className="flex gap-0.5 shrink-0">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={size}
          className={`${
            i < Math.floor(rating) 
              ? "text-yellow-400 fill-yellow-400" 
              : "text-slate-200 fill-slate-200"
          }`}
        />
      ))}
    </div>
  );

  return (
    <section className="bg-white py-12 px-4 md:px-8 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8 border-b border-slate-100 pb-6">
          <h2 className="text-2xl font-bold text-slate-900">Customer Reviews</h2>
          <div className="flex items-center gap-2 mt-2">
            {renderStars(stats.avg)}
            <span className="text-slate-500 text-sm font-medium ml-2">
              Based on {stats.total} reviews
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT: SUMMARY (Stacks on mobile) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="flex items-end gap-3 mb-6">
                <span className="text-5xl font-extrabold text-slate-900 leading-none">
                  {stats.avg}
                </span>
                <span className="text-sm text-slate-500 font-medium mb-1">
                  out of 5
                </span>
              </div>

              {/* Distribution Bars */}
              <div className="space-y-3">
                {stats.distribution.map((count, idx) => {
                  const stars = 5 - idx;
                  const percentage = stats.total ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3 text-sm">
                      <span className="w-3 font-medium text-slate-600">{stars}</span>
                      <Star size={14} className="text-slate-400 shrink-0" />
                      <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-slate-400 tabular-nums">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: FILTERABLE LIST */}
          <div className="lg:col-span-8 w-full max-w-full">
            
            {/* CONTROLS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <span className="font-semibold text-slate-900 text-sm sm:text-base">
                Showing {displayedReviews.length} of {stats.total} Reviews
              </span>
              
              <div className="relative w-full sm:w-auto">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full sm:w-auto appearance-none bg-white border border-slate-300 text-slate-900 text-sm font-medium rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent cursor-pointer"
                >
                  <option value="helpful">Most Helpful</option>
                  <option value="newest">Newest First</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                </select>
                <ChevronDown className="absolute right-3 top-3 text-slate-500 pointer-events-none" size={16} />
              </div>
            </div>

            {/* EMPTY STATE */}
            {reviews.length === 0 && (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <Star className="text-slate-300 mx-auto mb-3" size={32} />
                <h3 className="text-lg font-medium text-slate-900">No reviews yet</h3>
              </div>
            )}

            {/* LIST */}
            <div className="space-y-8">
              {displayedReviews.map((review) => {
                // Determine current count (server count + optimistic local update)
                const currentHelpfulCount = helpfulUpdates[review.id] ?? (review.helpful_count || 0);
                const isLiked = likedReviews.has(review.id);

                return (
                  <div key={review.id} className="border-b border-slate-100 pb-8 last:border-0 last:pb-0 w-full">
                    
                    {/* Review Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm overflow-hidden relative border border-slate-200">
                           {review.user_avatar ? (
                              <Image 
                                src={review.user_avatar} 
                                alt={review.user_name} 
                                fill 
                                className="object-cover"
                                unoptimized 
                              />
                           ) : (
                              review.user_name ? review.user_name.charAt(0).toUpperCase() : 'U'
                           )}
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm truncate max-w-[120px] sm:max-w-none">
                            {review.user_name || 'Anonymous'}
                          </h4>
                          <div className="flex items-center gap-1 mt-0.5">
                            <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">Verified Buyer</span>
                          </div>
                        </div>
                      </div>

                      <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-2">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Stars */}
                    <div className="mb-2">
                      {renderStars(review.rating, 14)}
                    </div>
                    
                    {review.title && (
                      <h5 className="font-bold text-slate-900 mb-2 text-sm md:text-base">{review.title}</h5>
                    )}
                    
                    <p className="text-slate-600 text-sm md:text-base leading-relaxed break-words">
                      {review.comment}
                    </p>

                    {/* Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-4 overflow-x-auto pb-2 w-full touch-pan-x scrollbar-hide">
                        {review.images.map((img, i) => (
                          <div key={i} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-slate-100">
                            <Image
                              src={img}
                              alt="Review attachment"
                              fill
                              className="object-cover"
                              unoptimized 
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 mt-4">
                      <button 
                        onClick={() => handleHelpfulClick(review.id, currentHelpfulCount)}
                        disabled={isLiked}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                          isLiked 
                            ? "bg-slate-900 text-white cursor-default" 
                            : "bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                      >
                        <ThumbsUp size={14} className={isLiked ? "fill-white" : ""} />
                        Helpful ({currentHelpfulCount})
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* LOAD MORE BUTTON */}
            {hasMore && (
              <div className="mt-12 text-center">
                <button 
                  onClick={() => setVisibleCount(prev => Math.min(prev + 5, 20))}
                  className="w-full sm:w-auto px-8 py-3 bg-white border border-slate-300 hover:border-slate-900 text-slate-900 font-medium rounded-full transition-all text-sm shadow-sm"
                >
                  Show More Reviews
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}