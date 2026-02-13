// Removed "use client" -> This makes it a Server Component (Faster)
import Image from "next/image";

interface Feature {
  id: number;
  label: string;
  src: string;
}

const FEATURES: Feature[] = [
  { id: 1, label: "NOURISHES SCALP & HAIR", src: "/SVGS/6.png" },
  { id: 2, label: "100% HERBAL FORMULA", src: "/SVGS/2.svg" },
  { id: 3, label: "Dermatologist Tested", src: "/SVGS/3.svg" },
  { id: 4, label: "DANDRUFF CONTROL", src: "/SVGS/7.png" },
];

const PromiseSection = () => {
  return (
    <section className="py-24 px-4 w-full bg-[#f4f4f4] border-b border-gray-200/50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-serif font-light text-center text-[#1a1a1a] mb-20 tracking-wide">
          Our Promise to You
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8 justify-items-center">
          {FEATURES.map((feature) => (
            <div
              key={feature.id}
              className="flex flex-col items-center gap-6 group"
            >
              {/* Icon Container */}
              <div className="relative w-16 h-16 md:w-20 md:h-20 opacity-80 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-100">
                <Image
                  src={feature.src}
                  alt={feature.label}
                  fill
                  // PERFORMANCE FIX: Tells browser these are small icons
                  sizes="(max-width: 768px) 64px, 80px"
                  className="object-contain"
                />
              </div>

              <span className="text-sm md:text-base font-light text-gray-600 tracking-widest uppercase text-center">
                {feature.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromiseSection;