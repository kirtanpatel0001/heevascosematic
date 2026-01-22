"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

const HeevasMagicResults = () => {
  // --- STATE ---
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  // --- 1. RESIZE OBSERVER (Prevents Image Squishing) ---
  useEffect(() => {
    if (!sliderRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(sliderRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // --- 2. SLIDER LOGIC ---
  const handleMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!sliderRef.current) return;

      // Get clientX from mouse or touch
      let clientX: number;
      if ("touches" in (event as TouchEvent)) {
        clientX = (event as TouchEvent).touches[0].clientX;
      } else {
        clientX = (event as MouseEvent).clientX;
      }

      // Calculate percentage
      const rect = sliderRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const width = rect.width;
      const percentage = Math.min(Math.max((x / width) * 100, 0), 100);

      setSliderPosition(percentage);
    },
    []
  );

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  // Keyboard navigation for accessibility
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    const step = 5;
    if (event.key === "ArrowLeft") {
      setSliderPosition((prev) => Math.max(0, prev - step));
    } else if (event.key === "ArrowRight") {
      setSliderPosition((prev) => Math.min(100, prev + step));
    }
  };

  // --- 3. GLOBAL EVENT LISTENERS (For smooth dragging outside container) ---
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleMove);
      window.addEventListener("touchend", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMove, handleMouseUp]);

  return (
    <section className="py-28 px-4 w-full bg-[#f4f4f4]">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-5xl md:text-[4rem] font-serif font-light text-[#1a1a1a] mb-8 tracking-wide">
          Magic Results
        </h2>
        <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto mb-16 leading-relaxed font-light">
          See the transformation with your own eyes. Our scientifically formulated
          ingredients repair damage and restore shine, taking your hair from dull
          to dazzling in just 30 days.
        </p>

        {/* --- SLIDER CONTAINER --- */}
        <div
          ref={sliderRef}
          className="relative w-full max-w-[900px] aspect-[4/3] md:aspect-video mx-auto overflow-hidden cursor-ew-resize select-none shadow-2xl rounded-lg border-[6px] border-white bg-gray-100 touch-action-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="slider"
          aria-valuenow={Math.round(sliderPosition)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Before and after comparison slider"
        >
          {/* 1. AFTER IMAGE (Background / Underneath) */}
          <Image
            src="/PNG/after.jpg"
            alt="After Result"
            fill
            className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none select-none"
            priority
          />

          {/* Label: After */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 bg-black/30 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-sm z-10">
            30 Days After
          </div>

          {/* 2. BEFORE IMAGE (Clipped Overlay) */}
          <div
            className="absolute top-0 left-0 h-full overflow-hidden pointer-events-none select-none"
            style={{ width: `${sliderPosition}%` }}
          >
            {/* Logic to prevent layout shift: wait for containerWidth */}
            {containerWidth > 0 && (
              <div
                className="relative h-full"
                style={{ width: `${containerWidth}px` }}
              >
                <Image
                  src="/PNG/before.jpg"
                  alt="Before Result"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Label: Before */}
            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-8 bg-black/30 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-sm z-10">
              Day 1 Before
            </div>
          </div>

          {/* 3. SLIDER HANDLE (The vertical line) */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_15px_rgba(0,0,0,0.3)]"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-800 border border-gray-100 transition-transform active:scale-90">
              {/* Left Arrow */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-[-2px]"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              {/* Right Arrow */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-[-2px]"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeevasMagicResults;