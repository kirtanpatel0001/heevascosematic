'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Leaf, 
  Sparkles, 
  Beaker, 
  Heart, 
  ShieldCheck,
  Sun
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen font-sans text-slate-900 selection:bg-black selection:text-white">
      
      {/* ================= 1. HERO HEADER ================= */}
      <section className="relative w-full h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden bg-gray-900">
        <div className="absolute inset-0 opacity-90">
          <Image 
            src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=1170&auto=format&fit=crop" 
            alt="Heevas Nature"
            fill
            className="object-cover"
            priority
            unoptimized={true}
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        
        <div className="relative z-10 text-center text-white">
          <h1 className="text-5xl md:text-8xl font-serif font-medium uppercase tracking-[0.2em] mb-6 drop-shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
            About Us
          </h1>
          <div className="inline-flex items-center gap-3 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase border border-white/30 px-8 py-3 rounded-full backdrop-blur-sm bg-white/10 hover:bg-white/20 transition-all">
            <Link href="/" className="hover:text-gray-200">Home</Link>
            <span className="opacity-50">•</span>
            <span>About</span>
          </div>
        </div>
      </section>

      <main className="max-w-[1440px] mx-auto">
        
        {/* ================= 2. MISSION SECTION (Updated from Image 1) ================= */}
        <section className="py-24 md:py-36 px-6 md:px-12 bg-white">
          <div className="flex flex-col items-center mb-20 text-center">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-4">
               Our Core
             </span>
             <h2 className="text-4xl md:text-6xl font-serif text-slate-900 tracking-tight uppercase relative">
               Mission
               <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-1 bg-black"></span>
             </h2>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 text-justify md:text-left leading-8 text-gray-500 font-light text-sm md:text-base">
            <p className="first-letter:text-6xl first-letter:font-serif first-letter:text-slate-900 first-letter:mr-4 first-letter:float-left first-letter:leading-none">
              At Heevas, we believe that every strand of hair deserves exceptional care and nourishment. 
              Rooted in innovation and guided by nature, our mission is to provide premium hair care 
              solutions that cater to your unique needs.
            </p>
            <p>
              Our products are crafted with the finest ingredients, ensuring a balance between tradition 
              and modern science. We are committed to sustainability and excellence, creating products 
              that not only transform hair care routines but also promote a sense of well-being. 
              With Heevas, experience the joy of hair care that loves you back.
            </p>
          </div>
        </section>

        {/* ================= 3. USP SECTION (New from Image 2) ================= */}
        <section className="py-24 bg-slate-50 px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-serif text-slate-900 uppercase tracking-widest">
                Our USP
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <ValueItem 
                icon={Leaf} 
                title="Nature-Infused Excellence" 
                desc="A perfect blend of natural goodness and modern innovation." 
              />
              <ValueItem 
                icon={Heart} 
                title="Focused on Hair Wellness" 
                desc="Prioritizing long-term hair health over temporary fixes." 
              />
              <ValueItem 
                icon={Beaker} 
                title="Trusted Expertise" 
                desc="Products developed with deep research and proven results." 
              />
              <ValueItem 
                icon={Sun} 
                title="Empowering Confidence" 
                desc="Helping customers embrace their natural beauty with radiant, healthy hair." 
              />
            </div>
          </div>
        </section>

        {/* ================= 4. JOURNEY TIMELINE ================= */}
        <section className="py-32 bg-white border-y border-gray-100 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 relative">
            
            <div className="text-center mb-24">
              <h3 className="text-4xl md:text-5xl font-serif text-slate-900 mb-4">Our Journey</h3>
              <div className="w-12 h-1 bg-slate-900 mx-auto"></div>
            </div>

            {/* THE VISIBLE CONNECTING LINE */}
            <div className="absolute left-8 md:left-1/2 top-48 bottom-10 w-[2px] bg-slate-300 transform md:-translate-x-1/2 z-0"></div>

            <div className="space-y-24 relative z-10">
              
              {/* ITEM 1: 2023 - The Vision */}
              <div className="relative flex flex-col md:flex-row items-center justify-between group">
                <div className="md:w-[45%] md:text-right order-2 md:order-1 pl-16 md:pl-0">
                  <span className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2 block">2023</span>
                  <h4 className="text-3xl font-serif text-slate-900 mb-4">The Vision</h4>
                  <p className="text-sm text-gray-500 font-light leading-relaxed">
                    It began with a thought: why choose between natural ingredients and real results? 
                    In 2023, we conceptualized the Heevas philosophy. We sketched blueprints, 
                    defined our ethos, and envisioned a brand that refused to compromise on quality.
                  </p>
                </div>
                {/* Dot */}
                <div className="absolute left-8 md:left-1/2 w-5 h-5 rounded-full bg-white border-4 border-slate-900 transform -translate-x-1/2 scale-100 group-hover:scale-125 transition-transform duration-300 shadow-xl"></div>
                <div className="md:w-[45%] order-1 md:order-2 hidden md:block"></div>
              </div>

              {/* ITEM 2: 2024 - The Research */}
              <div className="relative flex flex-col md:flex-row items-center justify-between group">
                <div className="md:w-[45%] order-1 hidden md:block"></div>
                {/* Dot */}
                <div className="absolute left-8 md:left-1/2 w-5 h-5 rounded-full bg-white border-4 border-slate-900 transform -translate-x-1/2 scale-100 group-hover:scale-125 transition-transform duration-300 shadow-xl"></div>
                <div className="md:w-[45%] md:pl-12 order-2 pl-16">
                  <span className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2 block">2024</span>
                  <h4 className="text-3xl font-serif text-slate-900 mb-4">The Science</h4>
                  <p className="text-sm text-gray-500 font-light leading-relaxed">
                    This was our year of deep research. We turned our kitchen into a laboratory, 
                    scouring the globe for the rarest botanicals. We tested hundreds of formulations, 
                    consulted with dermatologists, and perfected the balance until we found the "Golden Ratio."
                  </p>
                </div>
              </div>

              {/* ITEM 3: Present - The Realization */}
              <div className="relative flex flex-col md:flex-row items-center justify-between group">
                <div className="md:w-[45%] md:text-right order-2 md:order-1 pl-16 md:pl-0">
                  <span className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2 block">Present</span>
                  <h4 className="text-3xl font-serif text-slate-900 mb-4">The Arrival</h4>
                  <p className="text-sm text-gray-500 font-light leading-relaxed">
                    Today, the research has paid off. We are proud to unveil a product line that 
                    stands on the shoulders of science and nature. Our community is growing, and 
                    we are just getting started on redefining luxury wellness.
                  </p>
                </div>
                {/* Dot */}
                <div className="absolute left-8 md:left-1/2 w-5 h-5 rounded-full bg-slate-900 border-4 border-white transform -translate-x-1/2 scale-100 group-hover:scale-125 transition-transform duration-300 shadow-xl"></div>
                <div className="md:w-[45%] order-1 md:order-2 hidden md:block"></div>
              </div>

            </div>
          </div>
        </section>

        {/* ================= 5. CEO SECTION ================= */}
        <section className="py-32 bg-white px-6 md:px-12 overflow-hidden">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center">
            
            <div className="w-full md:w-1/2 relative z-0">
               <div className="relative aspect-[3/4] w-full shadow-2xl bg-white p-8 flex items-center justify-center">
                 <Image 
                   src="/VIPUAL.PNG"
                   alt="CEO Portrait"
                   width={400}
                   height={500}
                   className="object-contain"
                   priority
                 />
               </div>
            </div>

            <div className="w-full md:w-7/12 relative z-10 mt-[-60px] md:mt-0 md:-ml-24">
              <div className="bg-white p-10 md:p-20 shadow-2xl border border-gray-100">
                <div className="text-center md:text-left mb-10">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.5em] mb-4">
                    Hello From
                  </h4>
                  <h2 className="text-4xl md:text-6xl font-serif text-slate-900 uppercase tracking-widest">
                    The CEO
                  </h2>
                </div>

                <div className="text-gray-600 font-light leading-relaxed space-y-6 text-sm text-center md:text-left italic">
                  <p>
                    "Building Heevas was never about just selling products. It was about creating a 
                    sanctuary for your hair. I wanted to formulate blends that I would trust on my 
                    own family—pure, potent, and proven."
                  </p>
                  <p>
                    "We don't chase trends; we chase results. Today, I am proud to share this 
                    labor of love with you. Thank you for trusting us with your crown."
                  </p>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                      <p className="font-serif text-2xl text-slate-900">Kumbhani Vipul</p>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Founder & Creator</p>
                    </div>
                    <Leaf size={32} className="text-slate-200" />
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

// USP Component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ValueItem({ icon: Icon, title, desc }: any) {
  return (
    <div className="flex flex-col items-center text-center group bg-white p-8 border border-gray-100 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-500 rounded-2xl">
      <div className="p-4 mb-6 rounded-full bg-slate-50 text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-500">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <h4 className="font-serif text-xl text-slate-900 mb-3">{title}</h4>
      <p className="text-sm text-gray-500 font-light leading-relaxed">
        {desc}
      </p>
    </div>
  );
}