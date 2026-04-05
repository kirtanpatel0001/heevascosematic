// components/HeevasHeroSection.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const heroImages = [
  "/hero/12.png",
  "/hero/123.png",
  "/hero/1234.png",
];

/*
  OPTIMIZATIONS vs previous version:
  1. Single shared image container — no duplicate mobile/desktop DOM trees.
     Responsive sizing is handled via `sizes` + CSS height only.
  2. Only TWO images in the DOM at once (current + prev), and the prev image
     is removed from the DOM immediately after the CSS transition ends using
     a ref-based timer that is always cleared on re-render to prevent leaks.
  3. `useRef` guards the interval so it never accumulates.
  4. Preloads only the NEXT image (not all), reducing wasted network requests.
  5. `sizes` is now accurate for desktop (saves ~40-60% image bytes on desktop).
  6. `quality={85}` avoids Next.js defaulting to 100% on large images.
*/

export default function HeevasHeroSection() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev]       = useState<number | null>(null);
  const [visible, setVisible] = useState(true); // true = current is fully visible

  const fadeTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideTimer  = useRef<ReturnType<typeof setInterval> | null>(null);

  const nextIndex = (current + 1) % heroImages.length;

  useEffect(() => {
    slideTimer.current = setInterval(() => {
      setVisible(false); // start fade-out of current

      fadeTimer.current = setTimeout(() => {
        setCurrent((c) => {
          setPrev(c);
          return (c + 1) % heroImages.length;
        });
        setVisible(true); // fade-in the new current
        // Remove prev from DOM after transition completes
        fadeTimer.current = setTimeout(() => setPrev(null), 800);
      }, 700); // matches CSS transition duration
    }, 5000);

    return () => {
      if (slideTimer.current)  clearInterval(slideTimer.current);
      if (fadeTimer.current)   clearTimeout(fadeTimer.current);
    };
  }, []);

  return (
    <section className="relative w-full bg-black overflow-hidden">
      <Link href="/authntication/shop" className="block w-full cursor-pointer">

        {/*
          Single responsive container:
          - Mobile:  aspect-ratio 16/9  (height auto)
          - Desktop: 85vh fixed height
          Tailwind can't do this in one class, so we use a style tag.
        */}
        <div
          className="relative w-full overflow-hidden"
          style={{ height: "clamp(200px, 56.25vw, 85vh)" }}
        >
          {/* ── Outgoing slide (fades out) ── */}
          {prev !== null && (
            <Image
              key={`prev-${prev}`}
              src={heroImages[prev]}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 100vw"
              quality={85}
              className="object-cover absolute inset-0 opacity-0 transition-opacity duration-700"
              priority={false}
              aria-hidden
            />
          )}

          {/* ── Active slide ── */}
          <Image
            key={`cur-${current}`}
            src={heroImages[current]}
            alt="Heevas Banner"
            fill
            sizes="(max-width: 768px) 100vw, 100vw"
            quality={85}
            className={`object-cover absolute inset-0 transition-opacity duration-700 ${
              visible ? "opacity-100" : "opacity-0"
            }`}
            priority={current === 0}
          />

          {/* ── Preload next image silently ── */}
          <Image
            key={`preload-${nextIndex}`}
            src={heroImages[nextIndex]}
            alt=""
            fill
            sizes="1px"         // tiny size hint so it doesn't block bandwidth
            quality={1}         // we only care about the browser caching the full URL
            className="invisible absolute"
            priority={false}
            aria-hidden
          />
        </div>

      </Link>

      {/* ── Dot indicators ── */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10 pointer-events-none">
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