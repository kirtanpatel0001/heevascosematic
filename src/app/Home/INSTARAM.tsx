"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import Image from "next/image";

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Outfit:wght@400;500;600;700;800&display=swap');

  :root {
    --pink:   #d4526a;
    --orange: #e8825a;
    --cream:  #fdf8f3;
    --cream2: #f9f1e8;
    --warm:   #ede0d4;
    --dark:   #2c1f18;
    --text:   #3d2b22;
    --muted:  #9b7f72;
  }

  .hi-root  { font-family: 'Outfit', sans-serif; }
  .hi-serif { font-family: 'Playfair Display', serif; }

  @keyframes hi-fade-up {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0);    }
  }
  @keyframes hi-sound-wave {
    0%,100% { transform: scaleY(1);   }
    50%     { transform: scaleY(1.8); }
  }

  .hi-card {
    border-radius: 22px;
    overflow: hidden;
    cursor: pointer;
    background: #1a1008;
    transition: transform .32s cubic-bezier(.22,.68,0,1.2), box-shadow .32s ease;
    animation: hi-fade-up .5s ease both;
  }
  .hi-card:hover {
    transform: translateY(-6px) scale(1.012);
    box-shadow: 0 24px 56px rgba(212,82,106,.20), 0 8px 20px rgba(0,0,0,.13) !important;
  }



  .hi-eyebrow {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 13px; border-radius: 100px;
    background: rgba(212,82,106,.08);
    border: 1px solid rgba(212,82,106,.18);
    color: var(--pink); font-size: 10px; font-weight: 700; letter-spacing: .14em;
    text-transform: uppercase;
  }

  .hi-cta {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 28px; border-radius: 100px; text-decoration: none;
    font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700;
    letter-spacing: .03em; color: #fff;
    background: linear-gradient(135deg, #e8825a 0%, #d4526a 55%, #b84468 100%);
    box-shadow: 0 8px 28px rgba(212,82,106,.35);
    transition: transform .18s, box-shadow .18s;
  }
  .hi-cta:hover  { transform: scale(1.06); box-shadow: 0 12px 36px rgba(212,82,106,.45); }
  .hi-cta:active { transform: scale(.97); }

  /* Sound wave bars animation */
  .hi-wave { display:flex; align-items:center; gap:2px; }
  .hi-wave span {
    display:block; width:2.5px; background:#fff; border-radius:2px;
    animation: hi-sound-wave .7s ease infinite;
  }
  .hi-wave span:nth-child(1) { height:6px;  animation-delay:0s;    }
  .hi-wave span:nth-child(2) { height:10px; animation-delay:.15s;  }
  .hi-wave span:nth-child(3) { height:7px;  animation-delay:.3s;   }
  .hi-wave span:nth-child(4) { height:10px; animation-delay:.1s;   }
`;

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const REELS = [
  { id:1, video:"/VIEDOS/3.mp4", poster:"/imges/vv/01 Hair Oil/01 Hair Oil Amazon.jpg",          name:"Hair Oil",      sub:"Deeply nourishing",    price:"Rs. 699",   img:"/imges/vv/01 Hair Oil/01 Hair Oil Amazon.jpg",         href:"/product/c3225a76-cfce-4bc0-aece-aa9acae89793" },
  { id:2, video:"/VIEDOS/2.mp4", poster:"/imges/Shampoo/01 Amazon.png",                          name:"Shampoo",       sub:"Restore & strengthen", price:"Rs. 499",   img:"/imges/Shampoo/01 Amazon.png",                         href:"/product/880f3180-f861-4920-a8c3-7f299710a68f" },
  { id:3, video:"/VIEDOS/1.mp4", poster:"/imges/Conditionar/01 Amazon.png",                      name:"Conditioner",   sub:"Silky smooth finish",  price:"Rs. 599",   img:"/imges/Conditionar/01 Amazon.png",                     href:"/product/e69dac74-f0d8-4d5c-96c8-b720f9629d11" },
  { id:4, video:"/VIEDOS/5.mp4", poster:"/imges/vv/02 Hair Cleanser/517jMoaExzL._SL1500_.jpg",   name:"Hair Cleanser", sub:"One-step clarity",     price:"Rs. 1,399", img:"/imges/vv/02 Hair Cleanser/517jMoaExzL._SL1500_.jpg",  href:"/product/4e0f78b3-0f23-4d65-9b0b-27f1e8fbe266" },
  { id:5, video:"/VIEDOS/4.mp4", poster:"/imges/vv/03 Hair Mask/HAIRMASK.jpeg",                  name:"Hair Mask",     sub:"Intensive repair",     price:"Rs. 199",   img:"/imges/vv/03 Hair Mask/HAIRMASK.jpeg",                 href:"/product/0d186b1d-fc8e-4cdc-8c30-e5717c94629c" },
];

/* ─────────────────────────────────────────────
   ICONS
───────────────────────────────────────────── */
const PlayIcon  = () => <svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7L8 5z"/></svg>;
const ArrowIcon = () => <svg width="11" height="11" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>;
const ChevL     = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>;
const ChevR     = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>;
const MuteIcon  = () => <svg width="13" height="13" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>;
const InstaIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

/* ─────────────────────────────────────────────
   REEL CARD
   - isMobile + isFirst  → auto-unmute when visible
   - desktop             → hover triggers unmute/mute
───────────────────────────────────────────── */
function ReelCard({
  reel, idx, isMobile, isActiveSlide,
}: {
  reel: typeof REELS[0];
  idx: number;
  isMobile: boolean;
  isActiveSlide: boolean; // mobile only — true when this slide is centred
}) {
  const cardRef  = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted,   setMuted]   = useState(true);
  const [srcSet,  setSrcSet]  = useState(false);
  const [hovered, setHovered] = useState(false);

  /* ── auto-play via IntersectionObserver ── */
  useEffect(() => {
    const card = cardRef.current;
    const vid  = videoRef.current;
    if (!card || !vid) return;

    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!srcSet) { vid.src = reel.video; vid.load(); setSrcSet(true); }
        setTimeout(() => {
          vid.play().then(() => setPlaying(true)).catch(() => {});
        }, 80);
      } else {
        vid.pause();
        setPlaying(false);
        /* re-mute when leaving view so next scroll in starts clean */
        vid.muted = true;
        setMuted(true);
      }
    }, { threshold: isMobile ? 0.55 : 0.42 });

    obs.observe(card);
    return () => obs.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, reel.video]);

  /* ── mobile: unmute automatically when this card is the active slide ── */
  useEffect(() => {
    if (!isMobile) return;
    const vid = videoRef.current;
    if (!vid) return;
    if (isActiveSlide) {
      vid.muted = false;
      setMuted(false);
    } else {
      vid.muted = true;
      setMuted(true);
    }
  }, [isMobile, isActiveSlide]);

  /* ── desktop: unmute on hover, re-mute on leave ── */
  const handleMouseEnter = () => {
    if (isMobile) return;
    setHovered(true);
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = false;
    setMuted(false);
  };
  const handleMouseLeave = () => {
    if (isMobile) return;
    setHovered(false);
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = true;
    setMuted(true);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    playing ? (v.pause(), setPlaying(false)) : v.play().then(() => setPlaying(true)).catch(() => {});
  };

  /* manual mute toggle (still usable) */
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    setMuted(m => { v.muted = !m; return !m; });
  };

  const soundOn = !muted && playing;

  return (
    <div
      ref={cardRef}
      onClick={togglePlay}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="hi-card"
      style={{
        animationDelay: `${idx * 0.07}s`,
        boxShadow: (hovered || isActiveSlide)
          ? "0 0 0 2px #d4526a, 0 16px 48px rgba(212,82,106,.20)"
          : "0 4px 24px rgba(44,31,24,.10)",
      }}
    >
      {/* ── VIDEO ── */}
      <div style={{ position:"relative", paddingBottom:"177.78%", background:"#1a1008" }}>
        <video
          ref={videoRef}
          poster={reel.poster}
          muted={muted}
          loop
          playsInline
          preload="none"
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}
        />

        {/* Cinematic scrim — warm toned */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none",
          background:"linear-gradient(to top, rgba(28,14,6,.75) 0%, transparent 42%, rgba(28,14,6,.1) 100%)" }} />

        {/* Warm top-left glow */}
        <div style={{ position:"absolute", top:0, left:0, width:"60%", height:"40%", pointerEvents:"none",
          background:"radial-gradient(ellipse at top left, rgba(232,130,90,.1) 0%, transparent 70%)" }} />

        {/* ── Mute / Sound indicator pill ── */}
        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          style={{
            position:"absolute", top:10, right:10, zIndex:10,
            display:"flex", alignItems:"center", gap:5,
            padding:"5px 11px", borderRadius:100, border:"none",
            background:"rgba(28,14,6,.52)", backdropFilter:"blur(8px)",
            outline:"1px solid rgba(255,255,255,.14)",
            color:"#fff", cursor:"pointer",
            fontSize:9, fontWeight:800, letterSpacing:"0.08em",
          }}
        >
          {soundOn ? (
            /* animated sound wave bars */
            <div className="hi-wave">
              <span/><span/><span/><span/>
            </div>
          ) : (
            <MuteIcon />
          )}
          <span style={{ opacity:.9 }}>{soundOn ? "SOUND" : "MUTED"}</span>
        </button>

        {/* ── Play button when paused ── */}
        {!playing && (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
            <div style={{
              width:54, height:54, borderRadius:"50%",
              background:"rgba(253,248,243,.18)", backdropFilter:"blur(12px)",
              border:"2px solid rgba(253,248,243,.55)",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 4px 24px rgba(0,0,0,.3)",
            }}>
              <PlayIcon />
            </div>
          </div>
        )}

        {/* ── Tagline at bottom of video ── */}
        <div style={{ position:"absolute", bottom:54, left:12, right:12, pointerEvents:"none" }}>
          <p style={{ margin:0, color:"rgba(253,248,243,.65)", fontSize:10, fontWeight:600,
            letterSpacing:"0.1em", textTransform:"uppercase" }}>
            {reel.sub}
          </p>
        </div>
      </div>

      {/* ── PRODUCT STRIP ── */}
      <Link
        href={reel.href}
        onClick={e => e.stopPropagation()}
        style={{
          display:"flex", alignItems:"center", gap:11,
          padding:"11px 13px 13px",
          background:"linear-gradient(135deg,#fdf8f3 0%,#fff9f4 100%)",
          borderTop:"1px solid rgba(212,82,106,.1)",
          textDecoration:"none",
          transition:"background .18s",
          /* match card's bottom radius so it clips flush */
          borderBottomLeftRadius:22,
          borderBottomRightRadius:22,
        }}
      >
        {/* Product image */}
        <div style={{
          width:44, height:44, flexShrink:0,
          borderRadius:11, overflow:"hidden",
          border:"1.5px solid rgba(212,82,106,.2)",
          background:"#f5ede8",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={reel.img}
            alt={reel.name}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
          />
        </div>

        {/* Name + price */}
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{
            margin:0, fontSize:13, fontWeight:700,
            color:"#3d2b22", lineHeight:1.3,
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
          }}>
            {reel.name}
          </p>
          <p style={{ margin:"3px 0 0", fontSize:12, fontWeight:800, color:"#d4526a", lineHeight:1 }}>
            {reel.price}
          </p>
        </div>

        {/* Arrow CTA */}
        <div style={{
          flexShrink:0, width:30, height:30, borderRadius:"50%",
          display:"flex", alignItems:"center", justifyContent:"center",
          background:"linear-gradient(135deg,#e8825a,#d4526a)",
          boxShadow:"0 3px 12px rgba(212,82,106,.35)",
        }}>
          <ArrowIcon />
        </div>
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────── */
export default function HeevasInsta() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width:767px)");
    setIsMobile(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  const [emblaRef, emblaApi] = useEmblaCarousel({ align:"center", containScroll:"trimSnaps", loop:false });
  const [selIdx,  setSelIdx]  = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const onSel = useCallback(() => {
    if (!emblaApi) return;
    setSelIdx(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSel);
    onSel();
  }, [emblaApi, onSel]);

  return (
    <>
      <style>{STYLES}</style>

      <section
        className="hi-root"
        style={{
          width:"100%", paddingTop:64, paddingBottom:72,
          overflow:"hidden", position:"relative",
          background:"linear-gradient(180deg, #fdf4ec 0%, #ffffff 55%)",
        }}
      >
        {/* Warm ambient top glow */}
        <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)",
          width:700, height:260, pointerEvents:"none",
          background:"radial-gradient(ellipse, rgba(232,130,90,.09) 0%, transparent 70%)" }} />

        {/* ── HEADER ── */}
        <div style={{ textAlign:"center", marginBottom:40, padding:"0 16px", position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:14 }}>
            <span style={{ display:"block", width:28, height:1,
              background:"linear-gradient(90deg,transparent,#d4526a)" }} />
            <span className="hi-eyebrow"><InstaIcon size={10} /> @heevas_cosmetics_</span>
            <span style={{ display:"block", width:28, height:1,
              background:"linear-gradient(90deg,#d4526a,transparent)" }} />
          </div>

          <h2 className="hi-serif" style={{
            margin:0, fontSize:"clamp(2.4rem,6vw,4rem)", fontWeight:900,
            lineHeight:1.05, color:"var(--dark)",
          }}>
            Heevas{" "}
            <span style={{ fontStyle:"italic",
              background:"linear-gradient(135deg,#e8825a 0%,#d4526a 60%)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              Reels
            </span>
          </h2>

          <p style={{ margin:"10px 0 0", fontSize:13, color:"var(--muted)", fontWeight:500, letterSpacing:"0.04em" }}>
            Real hair. Real results. Shop directly from our feed.
          </p>
        </div>

        {/* ── DESKTOP GRID ── */}
        <div className="hidden md:flex" style={{ gap:16, padding:"0 24px", maxWidth:1400, margin:"0 auto" }}>
          {REELS.map((r, i) => (
            <div key={r.id} style={{ flex:1, minWidth:0 }}>
              <ReelCard reel={r} idx={i} isMobile={false} isActiveSlide={false} />
            </div>
          ))}
        </div>

        {/* ── MOBILE CAROUSEL ── */}
        <div className="md:hidden" style={{ position:"relative" }}>
          <div ref={emblaRef} style={{ overflow:"hidden" }}>
            <div style={{ display:"flex", gap:12, paddingLeft:"9vw", paddingRight:"9vw" }}>
              {REELS.map((r, i) => (
                <div key={r.id} style={{
                  flexShrink:0, width:"80vw",
                  transition:"transform .32s ease, opacity .32s ease",
                  transform: i === selIdx ? "scale(1)" : "scale(0.94)",
                  opacity:   i === selIdx ? 1 : 0.6,
                }}>
                  <ReelCard reel={r} idx={i} isMobile={true} isActiveSlide={i === selIdx} />
                </div>
              ))}
            </div>
          </div>

          {/* Nav arrows */}
          {([
            { side:"left",  disabled:!canPrev, fn:() => emblaApi?.scrollPrev(), ico:<ChevL /> },
            { side:"right", disabled:!canNext, fn:() => emblaApi?.scrollNext(), ico:<ChevR /> },
          ] as const).map(({ side, disabled, fn, ico }) => (
            <button key={side} onClick={fn} disabled={disabled} aria-label={side}
              style={{
                position:"absolute", [side]:6, top:"38%", transform:"translateY(-50%)", zIndex:20,
                width:36, height:36, borderRadius:"50%",
                border:"1.5px solid rgba(212,82,106,.18)",
                background:"#fdf8f3",
                boxShadow:"0 4px 16px rgba(44,31,24,.1)",
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"#7a5548", cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.22 : 1, transition:"all .2s",
              }}>{ico}
            </button>
          ))}

          {/* Pill dots */}
          <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:7, marginTop:18 }}>
            {REELS.map((_, i) => (
              <button key={i} onClick={() => emblaApi?.scrollTo(i)} aria-label={`Slide ${i+1}`}
                style={{
                  border:"none", cursor:"pointer", padding:0, borderRadius:100,
                  height:7, transition:"all .35s cubic-bezier(.22,.68,0,1.2)",
                  width: i === selIdx ? 24 : 7,
                  background: i === selIdx ? "#d4526a" : "rgba(212,82,106,.22)",
                }} />
            ))}
          </div>

          <p style={{ textAlign:"center", marginTop:10, fontSize:10,
            color:"rgba(61,43,34,.3)", fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase" }}>
            Swipe to explore
          </p>
        </div>

      </section>
    </>
  );
}