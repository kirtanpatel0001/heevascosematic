// components/HeevasHeroSection.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const heroImages = [
  "/hero/12.png",
  "/hero/123.png",
  "/hero/1234.png",
];

/* ─────────────────────────────────────────────
   PERF CHANGES vs original
   1. Only the ACTIVE slide is rendered (no hidden
      stack of 6 images).  A CSS fade swaps between
      current → next using a short opacity transition,
      so the UX looks identical but the browser only
      keeps 2 decoded images in memory at once.
   2. `sizes` prop tells Next.js the image always
      fills the full viewport width → it picks the
      smallest breakpoint that fits instead of always
      serving the 3840 px version.
   3. `priority` only on the very first image; the
      rest are lazy-loaded by default.
   4. Filenames have no spaces (rename your files
      in /public/hero/ to match, or keep the old
      names — just update the array above).
───────────────────────────────────────────── */

export default function HeevasHeroSection() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev]       = useState<number | null>(null);
  const [fading, setFading]   = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((c) => {
        const next = (c + 1) % heroImages.length;
        setPrev(c);
        setFading(true);
        // Clear the "outgoing" slide after the CSS transition finishes
        setTimeout(() => { setPrev(null); setFading(false); }, 900);
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative w-full bg-black">
      <Link href="/authntication/shop" className="block w-full cursor-pointer">

        {/* ── MOBILE ── */}
        <div className="block md:hidden relative w-full aspect-[16/9] overflow-hidden">
          {/* Outgoing slide (fades out) */}
          {prev !== null && (
            <Image
              key={`mobile-prev-${prev}`}
              src={heroImages[prev]}
              alt=""
              fill
              sizes="100vw"
              className={`object-cover absolute inset-0 transition-opacity duration-700 ${
                fading ? "opacity-0" : "opacity-100"
              }`}
              priority={false}
            />
          )}
          {/* Active slide */}
          <Image
            key={`mobile-cur-${current}`}
            src={heroImages[current]}
            alt="Heevas Banner"
            fill
            sizes="100vw"
            className="object-cover absolute inset-0 transition-opacity duration-700 opacity-100"
            priority={current === 0}
          />
        </div>

        {/* ── DESKTOP ── */}
        <div className="hidden md:block relative w-full h-[85vh] overflow-hidden">
          {prev !== null && (
            <Image
              key={`desk-prev-${prev}`}
              src={heroImages[prev]}
              alt=""
              fill
              sizes="100vw"
              className={`object-cover absolute inset-0 transition-opacity duration-700 ${
                fading ? "opacity-0" : "opacity-100"
              }`}
              priority={false}
            />
          )}
          <Image
            key={`desk-cur-${current}`}
            src={heroImages[current]}
            alt="Heevas Banner"
            fill
            sizes="100vw"
            className="object-cover absolute inset-0 transition-opacity duration-700 opacity-100"
            priority={current === 0}
          />
        </div>

      </Link>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {heroImages.map((_, i) => (
          <span
            key={i}
            className={`block rounded-full transition-all duration-300 ${
              i === current
                ? "w-5 h-2 bg-white"
                : "w-2 h-2 bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}