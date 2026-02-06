"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { MoveHorizontal } from "lucide-react";

interface BeforeAfterProps {
  beforeImage: string;
  afterImage: string;
}

export default function BeforeAfterSlider({ beforeImage, afterImage }: BeforeAfterProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => setIsResizing(true);
  
  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isResizing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(position, 0), 100));
  };

  useEffect(() => {
    const stopResizing = () => setIsResizing(false);
    window.addEventListener("mouseup", stopResizing);
    window.addEventListener("touchend", stopResizing);
    return () => {
      window.removeEventListener("mouseup", stopResizing);
      window.removeEventListener("touchend", stopResizing);
    };
  }, []);

  if (!beforeImage || !afterImage) return null;

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video min-h-[300px] md:min-h-[400px] overflow-hidden rounded-lg cursor-ew-resize select-none group shadow-xl bg-gray-100"
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
    >
      {/* 1. AFTER IMAGE (Background Layer) */}
      <Image
        src={afterImage}
        alt="After result"
        fill
        className="object-cover"
        draggable={false}
        priority 
        unoptimized={true}
      />
      <div className="absolute top-4 right-4 bg-black/50 text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded backdrop-blur-md z-10 tracking-widest pointer-events-none">
        After
      </div>

      {/* 2. BEFORE IMAGE (Overlay Layer with Clip-Path) */}
      <div 
        className="absolute inset-0 z-20"
        style={{ 
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` 
        }}
      >
        {/* Divider Line */}
        <div className="absolute top-0 bottom-0 right-0 w-[3px] bg-white h-full z-30 shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>

        <Image
          src={beforeImage}
          alt="Before result"
          fill
          className="object-cover" 
          draggable={false}
          priority
          unoptimized={true}
        />
        
        <div className="absolute top-4 left-4 bg-black/50 text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded backdrop-blur-md z-30 tracking-widest pointer-events-none">
          Before
        </div>
      </div>

      {/* 3. SLIDER HANDLE */}
      <div 
        className="absolute top-0 bottom-0 -ml-5 flex items-center justify-center pointer-events-none z-40"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-zinc-900 transform transition-transform duration-200 group-hover:scale-110">
          <MoveHorizontal size={20} />
        </div>
      </div>
    </div>
  );
}