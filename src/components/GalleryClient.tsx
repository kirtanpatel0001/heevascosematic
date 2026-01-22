"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Image as ImageIcon } from 'lucide-react';

interface Props {
  images: string[];
  name?: string;
}

export default function GalleryClient({ images, name }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [localImages, setLocalImages] = useState<string[]>(images || []);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (images && images.length > 0) setLocalImages(images);
  }, [images]);

  // Handle Thumbnail Click (Desktop & Mobile)
  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
    // Scroll the main container to the correct image
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollTo({
        left: width * index,
        behavior: "smooth",
      });
    }
  };

  // Handle Scroll on Main Image (Mobile Swipe)
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const width = scrollContainerRef.current.offsetWidth;
      // Calculate which image index is currently in view
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex !== selectedIndex && newIndex < localImages.length) {
        setSelectedIndex(newIndex);
      }
    }
  };

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 w-full h-full">
      
      {/* --- THUMBNAILS --- */}
      {localImages.length > 1 && (
        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:w-20 md:h-[750px] py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {localImages.map((img, i) => (
            <button 
              key={i} 
              onClick={() => handleThumbnailClick(i)} 
              className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border transition-all ${
                i === selectedIndex 
                  ? 'border-black ring-1 ring-black shadow-md opacity-100' 
                  : 'border-transparent opacity-70 hover:opacity-100 hover:border-zinc-300'
              }`}
            >
              <Image 
                src={img} 
                alt={`Thumbnail ${i}`} 
                fill 
                className="object-cover" 
                unoptimized={true}
              />
            </button>
          ))}
        </div>
      )}

      {/* --- MAIN IMAGE CAROUSEL (Mobile Swipe + Desktop Static) --- */}
      <div className="flex-1 relative bg-white rounded-none md:rounded-2xl overflow-hidden border-0 md:border border-zinc-100 aspect-[4/5] md:h-[750px] md:aspect-auto">
        
        {/* Scroll Container */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex w-full h-full overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
          style={{ scrollBehavior: 'smooth' }}
        >
          {localImages.length > 0 ? (
            localImages.map((img, i) => (
              <div 
                key={i} 
                className="w-full h-full flex-shrink-0 snap-center relative flex items-center justify-center bg-white"
              >
                <Image 
                  src={img} 
                  alt={`${name} - View ${i + 1}`} 
                  fill 
                  className="object-contain p-2 md:p-8" 
                  priority={i === 0}
                  unoptimized={true}
                />
              </div>
            ))
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300">
               <ImageIcon size={48} strokeWidth={1} />
               <span className="text-sm font-medium mt-2">No Image</span>
             </div>
          )}
        </div>

        {/* Mobile Dots Indicator (Optional Overlay) */}
        {localImages.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 md:hidden">
            {localImages.map((_, i) => (
              <div 
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${i === selectedIndex ? 'bg-black' : 'bg-zinc-300'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}