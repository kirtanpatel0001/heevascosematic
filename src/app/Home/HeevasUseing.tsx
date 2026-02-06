"use client";

import React from "react";
import { motion } from "framer-motion";

const HeevasUsingSection = () => {
  const steps = [
    {
      id: 1,
      step: "01", 
      title: "Pre-Wash Treatment",
      product: "Varnika Veda Hair Oil",
      desc: "Apply to roots and massage gently. Leave overnight or 1 hour before washing.",
      color: "from-amber-100 to-amber-50",
    },
    {
      id: 2,
      step: "02",
      title: "The Cleanse",
      product: "Misilk Shine / Argan Lavish Cleanser",
      desc: "Gently lather to cleanse without stripping natural oils.",
      color: "from-blue-100 to-blue-50",
    },
    
    {
      id: 3,
      step: "03",
      title: "Seal & Protect",
      product: "Argan Lavish Scalp Conditioner",
      desc: "Seal moisture and smooth the cuticle. Rinse with cool water.",
      color: "from-purple-100 to-purple-50",
    },
    {
      id: 4,
      step: "04",
      title: "Deep Repair",
      product: "Argan Blossom Hair Mask",
      desc: "Apply mid-length to ends. Leave for 15 minutes.",
      color: "from-rose-100 to-rose-50",
    },
  ];

  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 md:mb-24">
          <span className="text-gray-700 font-bold tracking-[0.25em] text-xs uppercase block mb-3">
            The Perfect Routine
          </span>
          <h2 className="text-4xl md:text-6xl font-serif text-[#1a1a1a] mb-6">
            Your 4-Step <span className="italic text-gray-400">Ritual</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Consistency beats magic. Follow the ritual.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Spine - Hidden on Mobile to prevent overlap, Visible on Desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[2px] bg-gray-200 -translate-x-1/2" />

          <div className="space-y-8 md:space-y-24">
            {steps.map((item, index) => {
              const isLeft = index % 2 === 0;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  // Changed grid logic slightly to prevent gaps on mobile
                  className="relative grid grid-cols-1 md:grid-cols-2 items-center"
                >
                  {/* LEFT */}
                  {isLeft ? (
                    <div className="md:pr-12">
                      <Card item={item} />
                    </div>
                  ) : null}

                  {/* Spacer - Hidden on Mobile */}
                  <div className="hidden md:block" />

                  {/* RIGHT */}
                  {!isLeft ? (
                    <div className="md:pl-12">
                      <Card item={item} />
                    </div>
                  ) : null}

                  {/* Step Dot - CENTRAL (Desktop Only) */}
                  {/* Added 'hidden md:flex' so this DOES NOT show on mobile */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-black text-white items-center justify-center font-bold border-4 border-white shadow-lg z-10">
                    {item.step}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

const Card = ({ item }: any) => (
  <div className="relative rounded-2xl shadow-xl bg-white border border-gray-100 overflow-hidden">
    
    {/* STEP NUMBER – MOBILE ONLY (Top Right Corner) */}
    {/* This will show on mobile, while the central dot is hidden */}
    <div className="md:hidden absolute top-4 right-4 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold shadow-md z-20">
      {item.step}
    </div>

    {/* Visual Block */}
   

    <div className="p-6">
      <span className="text-xs tracking-widest uppercase text-gray-400 block mb-2">
        {item.title}
      </span>
      <h3 className="text-2xl font-serif mb-3 text-[#1a1a1a]">
        {item.product}
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed">
        {item.desc}
      </p>
    </div>
  </div>
);

export default HeevasUsingSection;