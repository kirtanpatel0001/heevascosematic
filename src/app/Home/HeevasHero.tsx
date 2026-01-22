// components/HeevasHeroSection.jsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Montserrat } from 'next/font/google';

// Font Configuration
const montserrat = Montserrat({ 
  subsets: ['latin'], 
  weight: ['300', '400', '500'] 
});

// --- FIXED IMAGE LINKS (Public & Permanent) ---
// 1. Woman Applying Serum (Left Image)
const leftImage = 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=1000&auto=format&fit=crop'; 
// 2. Natural Product Set (Right Image)
const rightImage = 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=1000&auto=format&fit=crop';

const HeevasHeroSection = () => {
  return (
    <section className={`flex flex-col md:flex-row w-full min-h-screen ${montserrat.className}`}>
      
      {/* --- Left Panel --- */}
      <div className="relative w-full h-[50vh] md:h-auto md:w-1/2 group overflow-hidden">
        <Image
          src={leftImage}
          alt="Woman applying skincare serum"
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-105"
          priority
        />
        {/* Darker overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20" /> 
        
        {/* Content Position */}
        <div className="absolute bottom-12 left-8 md:bottom-20 md:left-12 z-10 max-w-md">
          <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-light leading-snug tracking-wide mb-8">
            Modern Formula
            <br />
            <span className="font-normal">for Skin Health</span>
          </h1>
          <Link href="/shop/modern-formula">
            <button className="bg-[#E3C08D] hover:bg-[#d0a975] text-black text-[11px] font-medium uppercase tracking-[0.2em] px-10 py-3 transition-colors duration-300">
              Shop Now
            </button>
          </Link>
        </div>
      </div>

      {/* --- Right Panel --- */}
      <div className="relative w-full h-[50vh] md:h-auto md:w-1/2 group overflow-hidden">
        <Image
          src={rightImage}
          alt="Natural and organic skincare products"
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-105"
          priority
        />
        {/* Darker overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Content Position */}
        <div className="absolute top-12 left-8 md:top-20 md:left-12 z-10 max-w-md">
          <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-light leading-snug tracking-wide mb-8">
            Natural & Organic
            <br />
            <span className="font-normal">Skincare Set</span>
          </h1>
          <Link href="/shop/natural-organic">
            <button className="bg-[#E3C08D] hover:bg-[#d0a975] text-black text-[11px] font-medium uppercase tracking-[0.2em] px-10 py-3 transition-colors duration-300">
              Shop Now
            </button>
          </Link>
        </div>
      </div>

    </section>
  );
};

export default HeevasHeroSection;