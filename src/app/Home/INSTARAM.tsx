"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link"; // Assuming Next.js based on "use client"

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const reels = [
  {
    id: 1,
    video: "/VIEDOS/1.mp4",
    productName: "Hair Oil",
    price: "Rs. 699.00",
    productImg: "/imges/01 Hair Oil Amazon.jpg",
  },
  {
    id: 2,
    video: "/VIEDOS/2.mp4",
    productName: "Shampoo",
    price: "Rs. 499.00",
    productImg: "/imges/Shampoo/01 Amazon.png",
  },
  {
    id: 3,
    video: "/VIEDOS/3.mp4",
    productName: "Conditioner",
    price: "Rs. 599.00",
    productImg: "/imges/Conditionar/01 Amazon.png",
  },
  {
    id: 4,
    video: "/VIEDOS/4.mp4",
    productName: "Hair Cleanser",
    price: "Rs. 1,399.00",
    productImg: "/imges/vv/02 Hair Cleanser/517jMoaExzL._SL1500_.jpg",
  },
  {
    id: 5,
    video: "/VIEDOS/5.mp4",
    productName: "Hair Mask",
    price: "Rs. 199.00",
    productImg: "/imges/vv/03 Hair Mask/WhatsApp Image 2025-12-25 at 12.13.28 PM.jpeg",
  },
];

/* ─────────────────────────────────────────────
   SINGLE REEL CARD
───────────────────────────────────────────── */
function ReelCard({ reel }: { reel: (typeof reels)[0] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const vid = videoRef.current;
    const card = cardRef.current;
    if (!vid || !card) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          vid.play().then(() => setPlaying(true)).catch(() => {});
        } else {
          vid.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(card);
    return () => obs.disconnect();
  }, []);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (playing) {
      vid.pause();
      setPlaying(false);
    } else {
      vid.play();
      setPlaying(true);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;
    const next = !muted;
    setMuted(next);
    vid.muted = next;
  };

  return (
    <div
      ref={cardRef}
      onClick={togglePlay}
      className="flex flex-col rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer bg-black"
      style={{ width: "100%" }}
    >
      <div className="relative w-full" style={{ paddingBottom: "177.78%" }}>
        <video
          ref={videoRef}
          src={`${reel.video}#t=0.001`}
          muted={muted}
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />

        <button
          onClick={toggleMute}
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-all"
        >
          {muted ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>

        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/60 flex items-center justify-center shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <Link
        href="/authntication/shop"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-2 px-2.5 py-2.5 bg-white hover:bg-gray-50 transition-colors"
      >
        <img
          src={reel.productImg}
          alt={reel.productName}
          className="w-9 h-9 rounded-xl object-cover border border-pink-100 flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-gray-800 truncate leading-tight">{reel.productName}</p>
          <p className="text-[11px] font-bold text-gray-600 mt-0.5">{reel.price}</p>
        </div>
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────────
   INSTA ICON
───────────────────────────────────────────── */
function InstaIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   MAIN SECTION
───────────────────────────────────────────── */
export default function HeevasInsta() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  return (
    <section className="w-full py-12 bg-white overflow-hidden">
      {/* Header */}
      <div className="text-center mb-8 px-4">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 uppercase">
          HEEVAS{" "}
          <span className="text-pink-500">
            INSTA
          </span>
        </h2>
        <p className="text-xs text-gray-400 mt-1.5 tracking-wide">Shop the look · As seen on our feed</p>
      </div>

      {/* Desktop Grid */}
      <div className="hidden md:flex gap-3 px-6 lg:px-10 xl:px-16 max-w-screen-2xl mx-auto">
        {reels.map((reel) => (
          <div key={reel.id} className="flex-1 min-w-0">
            <ReelCard reel={reel} />
          </div>
        ))}
      </div>

      {/* Mobile Carousel */}
      <div className="md:hidden relative px-2">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-3 px-2">
            {reels.map((reel) => (
              <div key={reel.id} className="flex-shrink-0 w-[47vw]">
                <ReelCard reel={reel} />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => emblaApi?.scrollPrev()}
          disabled={!canPrev}
          className="absolute -left-1 top-[40%] z-20 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => emblaApi?.scrollNext()}
          disabled={!canNext}
          className="absolute -right-1 top-[40%] z-20 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="flex justify-center gap-1.5 mt-4">
          {reels.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === selectedIndex ? "w-5 h-2 bg-pink-500" : "w-2 h-2 bg-pink-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Follow CTA */}
      <div className="mt-10 flex flex-col items-center justify-center text-center">
        <a
          href="https://www.instagram.com/heevasbeauty"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#f56040] to-[#e1306c] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <InstaIcon className="w-5 h-5" />
          Follow Us on Instagram
        </a>
        <p className="mt-3 text-xs text-gray-400 tracking-wide">
          Tag #HeevasGlow to be featured
        </p>
      </div>
    </section>
  );
}