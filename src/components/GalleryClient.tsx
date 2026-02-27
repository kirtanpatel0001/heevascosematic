"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Image as ImageIcon, ChevronDown } from 'lucide-react';

interface Props {
  images: string[];
  name?: string;
  badge?: string; // e.g. "Best Seller"
}

export default function GalleryClient({ images, name, badge }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [localImages, setLocalImages] = useState<string[]>(images || []);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const thumbContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    if (images && images.length > 0) setLocalImages(images);
  }, [images]);

  // Check if thumbs are scrollable
  useEffect(() => {
    const el = thumbContainerRef.current;
    if (el) {
      setCanScrollDown(el.scrollHeight > el.clientHeight);
    }
  }, [localImages]);

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
    // Scroll main image
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollTo({
        left: width * index,
        behavior: "smooth",
      });
    }
    // Scroll thumbnail into view
    if (thumbContainerRef.current) {
      const thumbEls = thumbContainerRef.current.querySelectorAll('button');
      if (thumbEls[index]) {
        thumbEls[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const width = scrollContainerRef.current.offsetWidth;
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex !== selectedIndex && newIndex < localImages.length) {
        setSelectedIndex(newIndex);
      }
    }
  };

  const scrollThumbsDown = () => {
    if (thumbContainerRef.current) {
      thumbContainerRef.current.scrollBy({ top: 156, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col-reverse md:flex-row gap-3 w-full">

      {/* ===================== THUMBNAILS (LEFT COLUMN — Desktop) ===================== */}
      {localImages.length > 1 && (
        <div className="flex md:flex-col items-center gap-0 flex-shrink-0">
          {/* Scrollable thumb list */}
          <div
            ref={thumbContainerRef}
            className="
              flex md:flex-col gap-2
              overflow-x-auto md:overflow-x-hidden
              overflow-y-hidden md:overflow-y-hidden
              md:max-h-[480px]
              [&::-webkit-scrollbar]:hidden
              [-ms-overflow-style:'none']
              [scrollbar-width:'none']
            "
          >
            {localImages.map((img, i) => (
              <button
                key={i}
                onClick={() => handleThumbnailClick(i)}
                className={`
                  relative flex-shrink-0
                  w-[64px] h-[68px] md:w-[72px] md:h-[76px]
                  rounded-[6px] overflow-hidden
                  bg-white
                  border-2 transition-all duration-200
                  ${i === selectedIndex
                    ? 'border-zinc-900 shadow-sm'
                    : 'border-zinc-200 opacity-80 hover:opacity-100 hover:border-zinc-400'
                  }
                `}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${i + 1}`}
                  fill
                  className="object-contain p-[6px]"
                  unoptimized={true}
                />
              </button>
            ))}
          </div>

          {/* Scroll Down indicator (only when more thumbs are hidden) */}
          {canScrollDown && (
            <button
              onClick={scrollThumbsDown}
              className="hidden md:flex items-center justify-center mt-2 w-8 h-8 rounded-full hover:bg-zinc-100 transition-colors text-zinc-500 hover:text-zinc-900"
            >
              <ChevronDown size={16} />
            </button>
          )}
        </div>
      )}

      {/* ===================== MAIN IMAGE AREA ===================== */}
      <div
        className="
          flex-1 relative
          bg-[#f4f4f4]
          rounded-xl overflow-hidden
          aspect-square
          md:max-h-[480px]
        "
      >
        {/* Best Seller / Badge */}
        {badge && (
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <span className="inline-block bg-orange-400 text-white text-[11px] font-bold px-3 py-[5px] rounded-full shadow-sm tracking-wide">
              {badge}
            </span>
          </div>
        )}

        {/* Scrollable / Swipeable Image Strip */}
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
                className="w-full h-full flex-shrink-0 snap-center relative flex items-center justify-center"
              >
                <Image
                  src={img}
                  alt={`${name} - View ${i + 1}`}
                  fill
                  className="object-contain p-6 md:p-10"
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

        {/* Mobile Dots Indicator */}
        {localImages.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 md:hidden">
            {localImages.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === selectedIndex ? 'bg-zinc-900' : 'bg-zinc-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}