// components/HeevasHeroSection.jsx
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const heroImages = [
  '/hero/01 Website banner.png',
  '/hero/02 Website banner.png',
  '/hero/03 Website banner.png'
];

const HeevasHeroSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full bg-white">
      <Link href="/authntication/shop" className="block w-full cursor-pointer group">
        
        {/* --- MOBILE VIEW --- 
            aspect-[16/9]: Adjust this if your images are square (aspect-square) 
            or taller. 16/9 is standard for wide banners. 
            This removes the top/bottom black bars. 
        */}
        <div className="block md:hidden relative w-full aspect-[16/9]"> 
           {heroImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
                index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <Image
                src={image}
                alt="Heevas Mobile Banner"
                fill
                className="object-cover" // Fills the box perfectly
                priority={index === 0}
              />
            </div>
          ))}
        </div>

        {/* --- DESKTOP VIEW --- 
            h-[85vh]: Keeps the tall, luxurious look on big screens.
        */}
        <div className="hidden md:block relative w-full h-[85vh]">
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
                index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <Image
                src={image}
                alt="Heevas Desktop Banner"
                fill
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}
        </div>

      </Link>
    </section>
  );
};

export default HeevasHeroSection;