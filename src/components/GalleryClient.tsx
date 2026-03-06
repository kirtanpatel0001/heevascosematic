"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Image as ImageIcon, ChevronDown } from "lucide-react";

interface Props {
  images: string[];
  name?: string;
  badge?: string;
}

export default function GalleryClient({ images, name, badge }: Props) {
  const [selectedIndex,  setSelectedIndex]  = useState(0);
  const [canScrollDown,  setCanScrollDown]  = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const thumbContainerRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = thumbContainerRef.current;
    if (!el) return;
    setCanScrollDown(el.scrollHeight > el.clientHeight);
  }, [images]);

  const handleThumbnailClick = useCallback((index: number) => {
    setSelectedIndex(index);
    scrollContainerRef.current?.scrollTo({
      left: (scrollContainerRef.current.offsetWidth) * index,
      behavior: "smooth",
    });
    const thumbEls = thumbContainerRef.current?.querySelectorAll("button");
    thumbEls?.[index]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const newIndex = Math.round(el.scrollLeft / el.offsetWidth);
    setSelectedIndex((prev) =>
      newIndex !== prev && newIndex < images.length ? newIndex : prev
    );
  }, [images.length]);

  const scrollThumbsDown = useCallback(() => {
    thumbContainerRef.current?.scrollBy({ top: 156, behavior: "smooth" });
  }, []);

  if (!images || images.length === 0) {
    return (
      <div className="flex-1 aspect-square rounded-xl flex flex-col items-center justify-center text-zinc-300">
        <ImageIcon size={48} strokeWidth={1} />
        <span className="text-sm font-medium mt-2">No Image</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-3 w-full">

      {/* ── THUMBNAILS ── */}
      {images.length > 1 && (
        <div className="flex md:flex-col items-center gap-0 flex-shrink-0">
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
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => handleThumbnailClick(i)}
                className={`
                  relative flex-shrink-0
                  w-[64px] h-[68px] md:w-[72px] md:h-[76px]
                  rounded-xl overflow-hidden
                  border-2 transition-all duration-200
                  shadow-[0_1px_6px_rgba(0,0,0,0.06)]
                  ${i === selectedIndex
                    ? "border-zinc-800 shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
                    : "border-zinc-100 opacity-70 hover:opacity-100 hover:border-zinc-300"}
                `}
              >
                <Image
                  src={img}
                  alt={`${name ?? "Product"} thumbnail ${i + 1}`}
                  fill
                  sizes="72px"
                  className="object-contain p-[6px]"
                />
              </button>
            ))}
          </div>

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

      {/* ── MAIN IMAGE — subtle border, no background box ── */}
      <div className="flex-1 relative overflow-hidden aspect-square md:max-h-[480px] rounded-2xl border border-zinc-100 shadow-[0_2px_24px_rgba(0,0,0,0.06)]">
        {badge && (
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <span className="inline-block bg-orange-400 text-white text-[11px] font-bold px-3 py-[5px] rounded-full shadow-sm tracking-wide">
              {badge}
            </span>
          </div>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex w-full h-full overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
          style={{ scrollBehavior: "smooth" }}
        >
          {images.map((img, i) => (
            <div
              key={i}
              className="w-full h-full flex-shrink-0 snap-center relative flex items-center justify-center"
            >
              <Image
                src={img}
                alt={`${name ?? "Product"} — view ${i + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-4 md:p-8"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {/* Mobile dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 md:hidden">
            {images.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === selectedIndex ? "bg-zinc-900" : "bg-zinc-300"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}