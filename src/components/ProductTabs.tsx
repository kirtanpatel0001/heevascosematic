"use client";
import { useState, useRef, useCallback } from "react";
import { Montserrat } from "next/font/google";
import Image from "next/image";

const montserrat = Montserrat({ subsets: ["latin"] });

// ─── Color Tokens ─────────────────────────────────────────────────────────────
const C = {
  tabNavBg: "#f5f5f5",
  tabInactiveBg: "#eeeeee",
  tabInactiveText: "#777777",
  tabActiveBg: "#1c1c1c",
  tabActiveText: "#ffffff",
  tabBorder: "#dddddd",
  panelBg: "#f9f9f9",
  panelBorder: "#dddddd",
  cardBg: "#ffffff",
  cardBorder: "#eeeeee",
  cardShadow: "0 4px 20px rgba(0,0,0,0.06)",
  promisesBg: "linear-gradient(145deg,#f7faf2 0%,#ecf5e0 100%)",
  promiseBadge: "#c9e265",
  greenCheck: "#5a9a3a",
  greyCheck: "#bbbbbb",
  labelColor: "#888888",
  valueColor: "#1f1f1f",
  bodyText: "#4a4a4a",
  disclaimerText: "#999999",
  noteText: "#3a3a3a",
  divider: "#dedede",
};

// ─── Types ────────────────────────────────────────────────────────────────────

// Shape of a hero ingredient as saved by admin
interface HeroIngredientDB {
  name: string;
  image: string;
  benefit1: string;
  benefit2: string;
}

// Shape of a usage step as saved by admin
interface UsageStepDB {
  title: string;
  text: string;   // admin saves as "text"
  image: string;
}

export interface ProductTabsProps {
  // ── Section 03: Descriptions
  description?: string;
  ingredients?: string;

  // ── Section 06: Hero Ingredients (from admin hero_ingredients column)
  hero_ingredients?: HeroIngredientDB[];

  // ── Section 05: How To Use (from admin usage_steps column)
  usage_steps?: UsageStepDB[];

  // ── Before / After (from admin before_image / after_image columns)
  before_image?: string | null;
  after_image?: string | null;

  // ── Section 07: Why Choose This
  comparison_our_image?: string | null;
  comparison_other_image?: string | null;
  comparison_promises_image?: string | null;
  our_product_features?: string[];
  others_features?: string[];

  // ── Section 08: Additional Information
  best_before?: string;
  net_content?: string;
  country_of_origin?: string;
  manufactured_by?: string;
  powered_by?: string;
  marketed_by?: string;
  customer_care_phone?: string;
  customer_care_email?: string;

  // ── Legacy props (kept for backward compatibility)
  productImage?: string | null;
  otherImage?: string | null;
  additionalInfoImage?: string | null;
}

// ─── Default fallbacks (used only when admin hasn't filled in data) ────────────

const defaultDescription =
  "Experience the power of our specially formulated product, crafted to deliver visible results. Enriched with powerful actives, it nourishes from root to tip, leaving your hair healthy and radiant. Suitable for all hair types.";

const defaultIngredients =
  "Aqua, Argan Oil, Aloe Barbadensis Leaf Extract, Panthenol, Glycerin, Biotin, Vitamin E, Rosmarinus Officinalis (Rosemary) Leaf Extract, Phenoxyethanol, Sodium Benzoate, Citric Acid.";

const defaultHeroIngredients: HeroIngredientDB[] = [
  { name: "Argan Oil", image: "", benefit1: "Deeply nourishes & restores moisture", benefit2: "Enhances shine, softness & smoothness" },
  { name: "Biotin (Vitamin B7)", image: "", benefit1: "Strengthens & thickens hair", benefit2: "Prevents hair loss & breakage" },
];

const defaultUsageSteps: UsageStepDB[] = [
  { title: "Apply", text: "Apply an appropriate amount evenly through wet or dry hair.", image: "" },
  { title: "Massage", text: "Gently massage into the scalp and work through lengths for 2–3 minutes.", image: "" },
  { title: "Rinse", text: "Rinse thoroughly with water. Repeat if necessary for best results.", image: "" },
];

const defaultOurFeatures = [
  "Powered by clinically-proven active ingredients",
  "Deeply nourishes scalp with premium botanicals",
  "Sulphate-free, Paraben-free & Derma-tested",
];

const defaultOthersFeatures = [
  "May not contain targeted active ingredients",
  "May cause dryness with harsh chemical bases",
  "May contain sulphates and parabens",
];

const defaultAdditionalInfo = {
  bestBefore: "18 Months",
  netContent: "",
  countryOfOrigin: "India",
  manufacturedBy: "",
  poweredBy: "",
  marketedBy: "",
  customerCarePhone: "",
  customerCareEmail: "",
};

// ─── Default Promise Badges (always shown, no admin input needed) ─────────────
const defaultPromises = [
  { label: "No Sulphate" },
  { label: "No Parabens" },
  { label: "No Phthalates" },
  { label: "Derma-Tested" },
  { label: "Cruelty-Free" },
];

function PromiseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="13" stroke="#5a9a3a" strokeWidth="1.5" />
      <path d="M8 14l4 4 8-8" stroke="#5a9a3a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── SVG Placeholder for missing ingredient images ────────────────────────────
function IngredientPlaceholder({ index }: { index: number }) {
  const colors = [
    { bg: "#c8dff0", c1: "#a0c4e0", c2: "#7ab0d5" },
    { bg: "#f5e6a3", c1: "#e8d060", c2: "#d4b840" },
  ];
  const c = colors[index % colors.length];
  return (
    <svg width="100%" height="100%" viewBox="0 0 120 160">
      <rect width="120" height="160" fill={c.bg} rx="8" />
      <circle cx="60" cy="80" r="40" fill={c.c1} opacity="0.5" />
      <circle cx="30" cy="40" r="20" fill={c.c2} opacity="0.4" />
    </svg>
  );
}

// ─── SVG Placeholders for Why Choose ─────────────────────────────────────────
function GreenBottleLarge() {
  return (
    <svg width="90" height="160" viewBox="0 0 90 160">
      <rect x="25" y="20" width="40" height="130" rx="12" fill="#4a8c3f" />
      <rect x="33" y="10" width="24" height="18" rx="6" fill="#3a7a2f" />
      <rect x="30" y="60" width="30" height="50" rx="4" fill="#ffffff" opacity="0.15" />
      <text x="45" y="145" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">100%</text>
    </svg>
  );
}
function SilverBottle() {
  return (
    <svg width="70" height="140" viewBox="0 0 70 140">
      <rect x="15" y="20" width="40" height="110" rx="10" fill="#aaaaaa" />
      <rect x="22" y="10" width="26" height="16" rx="5" fill="#999999" />
      <rect x="18" y="50" width="34" height="45" rx="4" fill="#ffffff" opacity="0.2" />
    </svg>
  );
}
function GreenBottleSmall() {
  return (
    <svg width="60" height="110" viewBox="0 0 60 110">
      <rect x="12" y="15" width="36" height="88" rx="10" fill="#5a9a3a" />
      <rect x="18" y="7" width="24" height="14" rx="5" fill="#4a8a2a" />
    </svg>
  );
}

// ─── Before/After Slider ──────────────────────────────────────────────────────
function BeforeAfterSlider({ beforeUrl, afterUrl }: { beforeUrl?: string | null; afterUrl?: string | null }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updateSlider = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.min(Math.max(((clientX - rect.left) / rect.width) * 100, 0), 100);
    setSliderPos(pct);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    updateSlider(e.clientX);
    const onMove = (ev: MouseEvent) => { if (isDragging.current) updateSlider(ev.clientX); };
    const onUp = () => { isDragging.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      onTouchMove={e => updateSlider(e.touches[0].clientX)}
      onTouchStart={e => updateSlider(e.touches[0].clientX)}
      style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 16, overflow: "hidden", cursor: "ew-resize", userSelect: "none", background: "#1a1a2e", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}
    >
      {/* AFTER — base layer */}
      <div style={{ position: "absolute", inset: 0 }}>
        {afterUrl
          ? <Image src={afterUrl} alt="After" fill style={{ objectFit: "cover" }} />
          : <AfterPlaceholder />}
        <div style={{ position: "absolute", bottom: 16, right: 16, background: "rgba(90,154,58,0.9)", color: "white", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, backdropFilter: "blur(4px)" }}>
          After ✨
        </div>
      </div>

      {/* BEFORE — clipped layer */}
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - sliderPos}% 0 0)`, transition: "clip-path 0.05s linear" }}>
        {beforeUrl
          ? <Image src={beforeUrl} alt="Before" fill style={{ objectFit: "cover" }} />
          : <BeforePlaceholder />}
        <div style={{ position: "absolute", bottom: 16, left: 16, background: "rgba(80,80,80,0.85)", color: "white", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, backdropFilter: "blur(4px)" }}>
          Before
        </div>
      </div>

      {/* Divider */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${sliderPos}%`, width: 3, background: "white", transform: "translateX(-50%)", boxShadow: "0 0 12px rgba(0,0,0,0.4)", pointerEvents: "none" }} />

      {/* Handle */}
      <div style={{ position: "absolute", top: "50%", left: `${sliderPos}%`, transform: "translate(-50%,-50%)", width: 44, height: 44, borderRadius: "50%", background: "white", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M6 10L2 10M2 10L5 7M2 10L5 13" stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 10L18 10M18 10L15 7M18 10L15 13" stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Hint */}
      <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.5)", color: "white", padding: "4px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, backdropFilter: "blur(4px)", whiteSpace: "nowrap", letterSpacing: "0.04em" }}>
        ← Drag to compare →
      </div>
    </div>
  );
}

function BeforePlaceholder() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice">
      <rect width="640" height="360" fill="#3a3a4a" />
      <circle cx="200" cy="120" r="60" fill="#555566" /><circle cx="320" cy="160" r="80" fill="#444455" />
      {[60,120,180,250,310,400,480,540,60,200,350].map((x, i) => (
        <ellipse key={i} cx={x} cy={80 + (i * 23) % 200} rx="4" ry="3" fill="white" opacity="0.4" />
      ))}
      <text x="320" y="310" textAnchor="middle" fill="#aaaaaa" fontSize="22" fontWeight="700">Before</text>
      <text x="320" y="335" textAnchor="middle" fill="#777788" fontSize="13">Flaky, itchy scalp</text>
    </svg>
  );
}
function AfterPlaceholder() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice">
      <rect width="640" height="360" fill="#1a2e1a" />
      <circle cx="200" cy="120" r="60" fill="#2a4a2a" /><circle cx="320" cy="160" r="80" fill="#224422" />
      {[100,200,300,400,500].map((x, i) => (
        <line key={i} x1={x} y1="40" x2={x+40} y2="140" stroke="#5a9a3a" strokeWidth="2" opacity="0.3" />
      ))}
      <text x="320" y="310" textAnchor="middle" fill="#c9e265" fontSize="22" fontWeight="700">After</text>
      <text x="320" y="335" textAnchor="middle" fill="#5a9a3a" fontSize="13">Clean, healthy scalp ✓</text>
    </svg>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: `1px solid ${C.divider}` }}>
      <div style={{ width: 180, flexShrink: 0, fontSize: 13, color: C.labelColor, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 13, color: C.valueColor, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{value}</div>
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: C.labelColor, textTransform: "uppercase", marginBottom: 20 }}>
      {children}
    </div>
  );
}

// ─── Step Icon Fallback ───────────────────────────────────────────────────────
function StepIconFallback({ step }: { step: number }) {
  const colors = [
    { bg: "#e8f4fd", border: "#4a9fd4" },
    { bg: "#f0fae8", border: "#5a9a3a" },
    { bg: "#fff8e8", border: "#e0a030" },
  ];
  const c = colors[(step - 1) % colors.length];
  return (
    <div style={{ width: 32, height: 32, borderRadius: "50%", background: c.bg, border: `1.5px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: c.border }}>
      {step}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
type TabId = "description" | "why" | "ingredients" | "additional";

export default function ProductTabs(props: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("description");

  // ── Resolve all data: admin data first, fallback to defaults ──────────────

  const description = props.description?.trim() || defaultDescription;
  const ingredients = props.ingredients?.trim() || defaultIngredients;

  // Hero Ingredients: use admin data if any ingredient has a name, else default
  const rawHeroIngredients = props.hero_ingredients || [];
  const heroIngredients = rawHeroIngredients.some(i => i.name?.trim())
    ? rawHeroIngredients.filter(i => i.name?.trim())
    : defaultHeroIngredients;

  // Usage Steps: use admin data if any step has text/title, else default
  const rawSteps = props.usage_steps || [];
  const usageSteps = rawSteps.some(s => s.title?.trim() || s.text?.trim())
    ? rawSteps.filter(s => s.title?.trim() || s.text?.trim())
    : defaultUsageSteps;

  // Before / After
  const beforeUrl = props.before_image || null;
  const afterUrl = props.after_image || null;
  const showBeforeAfter = !!(beforeUrl || afterUrl);

  // Why Choose This
  const ourImage = props.comparison_our_image || null;
  const otherImage = props.comparison_other_image || null;
  const promisesImage = props.comparison_promises_image || null;

  const rawOurFeatures = (props.our_product_features || []).filter(f => f?.trim());
  const ourFeatures = rawOurFeatures.length > 0 ? rawOurFeatures : defaultOurFeatures;

  const rawOthersFeatures = (props.others_features || []).filter(f => f?.trim());
  const othersFeatures = rawOthersFeatures.length > 0 ? rawOthersFeatures : defaultOthersFeatures;

  // Additional Information
  const info = {
    bestBefore:       props.best_before?.trim()          || defaultAdditionalInfo.bestBefore,
    netContent:       props.net_content?.trim()          || defaultAdditionalInfo.netContent,
    countryOfOrigin:  props.country_of_origin?.trim()    || defaultAdditionalInfo.countryOfOrigin,
    manufacturedBy:   props.manufactured_by?.trim()      || defaultAdditionalInfo.manufacturedBy,
    poweredBy:        props.powered_by?.trim()           || defaultAdditionalInfo.poweredBy,
    marketedBy:       props.marketed_by?.trim()          || defaultAdditionalInfo.marketedBy,
    customerCarePhone: props.customer_care_phone?.trim() || defaultAdditionalInfo.customerCarePhone,
    customerCareEmail: props.customer_care_email?.trim() || defaultAdditionalInfo.customerCareEmail,
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "description", label: "Description" },
    { id: "why", label: "Why choose this?" },
    { id: "ingredients", label: "All ingredients" },
    { id: "additional", label: "Additional information" },
  ];

  return (
    <div className={montserrat.className} style={{ width: "100%", maxWidth: 1100, margin: "0 auto", fontFamily: "inherit" }}>

      {/* ── TAB NAVIGATION ───────────────────────────────────────────────────── */}
      <div style={{ display: "flex", background: C.tabNavBg, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.tabBorder}`, marginBottom: 4 }}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: "16px 24px", fontSize: 14, fontWeight: 600,
              fontFamily: "inherit", letterSpacing: "0.015em", cursor: "pointer",
              border: "none", borderRight: index < tabs.length - 1 ? `1px solid ${C.tabBorder}` : "none",
              background: isActive ? C.tabActiveBg : C.tabInactiveBg,
              color: isActive ? C.tabActiveText : C.tabInactiveText,
              transition: "background 0.2s, color 0.2s", outline: "none", whiteSpace: "nowrap",
            }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── CONTENT PANEL ────────────────────────────────────────────────────── */}
      <div style={{ background: C.panelBg, border: `1px solid ${C.panelBorder}`, borderRadius: 16, padding: "40px 48px" }}>

        {/* ─────────────────────────────────────────────────────────────────────
            TAB 1: DESCRIPTION
        ───────────────────────────────────────────────────────────────────── */}
        {activeTab === "description" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>

            {/* Description text */}
            <div style={{ maxWidth: 760 }}>
              <SectionLabel>Description</SectionLabel>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: C.bodyText, margin: 0 }}>{description}</p>
            </div>

            {/* Hero Ingredients */}
            <div>
              <SectionLabel>Hero Ingredients</SectionLabel>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {heroIngredients.map((item, idx) => (
                  <div key={idx} style={{
                    flex: "1 1 260px", background: C.cardBg,
                    border: `1px solid ${C.cardBorder}`, borderRadius: 14,
                    boxShadow: C.cardShadow, padding: 20,
                    display: "flex", gap: 16, alignItems: "flex-start",
                  }}>
                    {/* Image */}
                    <div style={{ width: 80, height: 100, flexShrink: 0, borderRadius: 10, overflow: "hidden" }}>
                      {item.image ? (
                        <Image src={item.image} alt={item.name} width={80} height={100} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                      ) : (
                        <IngredientPlaceholder index={idx} />
                      )}
                    </div>
                    {/* Text */}
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.valueColor, marginBottom: 10 }}>{item.name}</div>
                      {[item.benefit1, item.benefit2].filter(Boolean).map((b, bi) => (
                        <div key={bi} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                          <span style={{ color: C.greenCheck, fontSize: 14, lineHeight: 1.5 }}>✓</span>
                          <span style={{ fontSize: 13, color: C.bodyText, lineHeight: 1.5 }}>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How To Use */}
            <div>
              <SectionLabel>How To Use</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {usageSteps.map((step, idx) => (
                  <div key={idx} style={{
                    background: C.cardBg, border: `1px solid ${C.cardBorder}`,
                    borderRadius: 14, boxShadow: C.cardShadow,
                    overflow: "hidden", position: "relative",
                  }}>
                    {/* Step image if available */}
                    {step.image ? (
                      <div style={{ width: "100%", aspectRatio: "4/3", overflow: "hidden", position: "relative" }}>
                        <Image src={step.image} alt={step.title} fill style={{ objectFit: "cover" }} />
                      </div>
                    ) : null}

                    <div style={{ padding: "20px 20px 24px", position: "relative" }}>
                      {/* Step number watermark */}
                      <div style={{ position: "absolute", top: -8, right: 12, fontSize: 64, fontWeight: 900, color: "#f0f0f0", lineHeight: 1, userSelect: "none" }}>
                        {idx + 1}
                      </div>
                      {/* Icon */}
                      <div style={{ marginBottom: 14 }}>
                        <StepIconFallback step={idx + 1} />
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.valueColor, marginBottom: 8, position: "relative" }}>
                        {step.title}
                      </div>
                      <div style={{ fontSize: 13, color: C.bodyText, lineHeight: 1.6, position: "relative" }}>
                        {step.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Before & After */}
            {showBeforeAfter && (
              <div>
                <SectionLabel>Before &amp; After</SectionLabel>
                <BeforeAfterSlider beforeUrl={beforeUrl} afterUrl={afterUrl} />
                <p style={{ fontSize: 12, color: C.disclaimerText, marginTop: 12, textAlign: "center" }}>
                  Results may vary. Images shown are for illustrative purposes.
                </p>
              </div>
            )}

          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────
            TAB 2: WHY CHOOSE THIS
        ───────────────────────────────────────────────────────────────────── */}
        {activeTab === "why" && (
          <div>
            <SectionLabel>Why Choose This?</SectionLabel>
            <div style={{ fontSize: 12, color: C.disclaimerText, marginBottom: 28 }}>Comparison of best in business</div>

            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {/* Our Product */}
              <div style={{ flex: "1 1 240px", background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 14, boxShadow: C.cardShadow, padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.valueColor, marginBottom: 16, textAlign: "center" }}>Our Product</div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, minHeight: 100 }}>
                  {ourImage
                    ? <Image src={ourImage} alt="Our Product" width={90} height={160} style={{ objectFit: "contain" }} />
                    : <GreenBottleLarge />}
                </div>
                {ourFeatures.map((feature, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
                    <span style={{ color: C.greenCheck, fontSize: 14, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: C.bodyText, lineHeight: 1.5 }}>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Others */}
              <div style={{ flex: "1 1 240px", background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 14, boxShadow: C.cardShadow, padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.valueColor, marginBottom: 16, textAlign: "center" }}>Others</div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, minHeight: 100 }}>
                  {otherImage
                    ? <Image src={otherImage} alt="Competitor" width={70} height={140} style={{ objectFit: "contain" }} />
                    : <SilverBottle />}
                </div>
                {othersFeatures.map((feature, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
                    <span style={{ color: C.greyCheck, fontSize: 14, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: C.bodyText, lineHeight: 1.5 }}>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Our Promises */}
              <div style={{ flex: "1 1 240px", background: C.promisesBg, border: `1px solid ${C.cardBorder}`, borderRadius: 14, boxShadow: C.cardShadow, padding: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: C.greenCheck, marginBottom: 16, textAlign: "center" }}>
                  OUR PROMISES
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  {defaultPromises.map((p, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <PromiseIcon />
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.valueColor, textAlign: "center" }}>{p.label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  {promisesImage
                    ? <Image src={promisesImage} alt="Product" width={60} height={110} style={{ objectFit: "contain" }} />
                    : <GreenBottleSmall />}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────
            TAB 3: ALL INGREDIENTS
        ───────────────────────────────────────────────────────────────────── */}
        {activeTab === "ingredients" && (
          <div style={{ maxWidth: 760 }}>
            <SectionLabel>All Ingredients</SectionLabel>
            <p style={{ fontSize: 14, lineHeight: 1.9, color: C.bodyText, margin: "0 0 20px 0" }}>
              {ingredients}{" "}
              <span style={{ color: C.disclaimerText, fontSize: 12 }}>
                Disclaimer: Ingredients listed may vary slightly from products received. Before use, refer to packaging for the most up-to-date ingredient information and any warnings or instructions.
              </span>
            </p>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────
            TAB 4: ADDITIONAL INFORMATION
        ───────────────────────────────────────────────────────────────────── */}
        {activeTab === "additional" && (
          <div style={{ maxWidth: 760 }}>
            <SectionLabel>Additional Information</SectionLabel>
            <InfoRow label="Best Before"       value={info.bestBefore} />
            <InfoRow label="Net Content"       value={info.netContent} />
            <InfoRow label="Country of Origin" value={info.countryOfOrigin} />
            <InfoRow label="Manufactured By"   value={info.manufacturedBy} />
            <InfoRow label="Powered By"        value={info.poweredBy} />
            <InfoRow label="Marketed By"       value={info.marketedBy} />
            {(info.customerCarePhone || info.customerCareEmail) && (
              <div style={{ padding: "20px 0", borderBottom: `1px solid ${C.divider}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.valueColor, marginBottom: 8 }}>Customer Care Support:</div>
                <div style={{ fontSize: 13, color: C.bodyText, lineHeight: 1.8 }}>
                  {info.customerCarePhone && <>Call {info.customerCarePhone}</>}
                  {info.customerCarePhone && info.customerCareEmail && " or write to us at "}
                  {info.customerCareEmail && (
                    <a href={`mailto:${info.customerCareEmail}`} style={{ color: C.greenCheck }}>
                      {info.customerCareEmail}
                    </a>
                  )}
                </div>
              </div>
            )}
            <div style={{ padding: "16px 0", fontSize: 12, color: C.noteText, lineHeight: 1.7 }}>
              <strong>Note:</strong> Prices include benefits of GST Reform 2.0 with reduced GST rates.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}