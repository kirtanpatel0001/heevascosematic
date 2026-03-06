"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const HeevasUsingSection = () => {
  const steps = [
    {
      id: 1,
      step: "01",
      title: "Pre-Wash Treatment",
      product: "Varnika Veda Hair Oil",
      desc: "Apply to roots and massage gently. Leave overnight or 1 hour before washing.",
      color: "from-amber-100 to-amber-50",
      video: "/VIEDOS/1.mp4",
      href: "/product/c3225a76-cfce-4bc0-aece-aa9acae89793",
    },
    {
      id: 2,
      step: "02",
      title: "The Cleanse",
      product: "Misilk Shine / Argan Lavish Cleanser",
      desc: "Gently lather to cleanse without stripping natural oils.",
      color: "from-blue-100 to-blue-50",
      video: "/VIEDOS/1.mp4",
      href: "/product/4e0f78b3-0f23-4d65-9b0b-27f1e8fbe266",
    },
    {
      id: 3,
      step: "03",
      title: "Seal & Protect",
      product: "Argan Lavish Scalp Conditioner",
      desc: "Seal moisture and smooth the cuticle. Rinse with cool water.",
      color: "from-purple-100 to-purple-50",
      video: "/VIEDOS/3.mp4",
      href: "/product/e69dac74-f0d8-4d5c-96c8-b720f9629d11",
    },
    {
      id: 4,
      step: "04",
      title: "Deep Repair",
      product: "Argan Blossom Hair Mask",
      desc: "Apply mid-length to ends. Leave for 15 minutes.",
      color: "from-rose-100 to-rose-50",
      video: "/VIEDOS/4.mp4",
      href: "/product/0d186b1d-fc8e-4cdc-8c30-e5717c94629c",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-20">
          <span className="text-gray-700 font-semibold tracking-[0.3em] text-xs uppercase block mb-4">
            The Perfect Routine
          </span>

          <h2 className="text-4xl md:text-6xl font-serif text-[#1a1a1a] mb-6">
            Your 4-Step <span className="italic text-gray-400">Ritual</span>
          </h2>

          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Consistency beats magic. Follow the ritual for visible transformation.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              viewport={{ once: true }}
            >
              <Card item={item} />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

const Card = ({ item }: { item: any }) => {
  return (
    <div className="relative bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">

      {/* Step Badge */}
      <div className="absolute top-5 right-5 w-11 h-11 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold shadow-md z-20">
        {item.step}
      </div>

      {/* Video Section */}
      <div className="relative h-64 w-full overflow-hidden">
        <video
          src={item.video}
          autoPlay
          loop
          muted
          playsInline
          className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
        />

        {/* Gradient Overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-tr opacity-20 mix-blend-multiply pointer-events-none ${item.color}`}
        />
      </div>

      {/* Content */}
      <div className="p-8">
        <span className="text-xs tracking-widest uppercase text-gray-400 block mb-2">
          {item.title}
        </span>

        <h3 className="text-xl font-serif mb-3 text-[#1a1a1a]">
          {item.product}
        </h3>

        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          {item.desc}
        </p>

        <Link
          href={item.href}
          className="block w-full py-3 rounded-full bg-black text-white text-sm font-medium text-center transition hover:bg-gray-800"
        >
          Explore Product
        </Link>
      </div>
    </div>
  );
};

export default HeevasUsingSection;