"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation"; 
import { motion, Variants } from "framer-motion";
import { ArrowUpRight, Droplets, Shield, Sparkles, Zap } from "lucide-react";

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 12 },
  },
};

const ShopByConcernFinal = () => {
  const router = useRouter();

  const concerns = [
    {
      id: 1,
      title: "Hair Fall Control",
      subtitle: "Anchor roots & reduce breakage",
      icon: <Shield className="w-6 h-6" />,
      queryParam: "hair-fall",
      image: "https://images.unsplash.com/photo-1633179963355-44f57f194d54?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    },
    {
      id: 2,
      title: "Frizz & Dryness",
      subtitle: "Deep hydration for silkiness",
      icon: <Droplets className="w-6 h-6" />,
      queryParam: "frizz-dryness",
      image: "https://plus.unsplash.com/premium_photo-1706800176020-49d04f18b9a6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    },
    {
      id: 3,
      title: "Scalp Detox",
      subtitle: "Remove dandruff & buildup",
      icon: <Sparkles className="w-6 h-6" />,
      queryParam: "scalp-detox",
      image: "https://plus.unsplash.com/premium_photo-1733317329824-7028adef050a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    },
    {
      id: 4,
      title: "Damage Repair",
      subtitle: "Revive heat-treated hair",
      icon: <Zap className="w-6 h-6" />,
      queryParam: "damage-repair",
      image: "https://plus.unsplash.com/premium_photo-1728693696268-408c2647eb2d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0",
    },
  ];

  // --- UPDATED NAVIGATION LOGIC ---
  const handleCardClick = (concernSlug: string) => {
    // Updated path to match your specific route: /authntication/shop
    router.push(`/authntication/shop?concern=${concernSlug}`);
  };

  return (
    <section className="py-24 md:py-32 px-4 w-full bg-white relative overflow-hidden">
      
      {/* Background Decor Blur */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 0.6, scale: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute top-0 right-0 w-[500px] md:w-[600px] h-[500px] md:h-[600px] bg-[#f8f5f2] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"
      />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6"
        >
          <div className="max-w-2xl text-left">
            <span className="text-gray-700 font-bold tracking-[0.2em] text-xs uppercase mb-3 block">
              Personalized Routine
            </span>
            <h2 className="text-4xl md:text-6xl font-serif text-[#1a1a1a] leading-tight">
              Shop by <span className="italic text-gray-400">Concern</span>
            </h2>
          </div>

          <p className="text-gray-600 font-light text-sm md:text-base max-w-sm leading-relaxed text-left md:text-right">
            Select your primary hair goal to see the scientifically curated kit for you.
          </p>
        </motion.div>

        {/* THE GRID */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-auto md:h-[480px]"
        >
          {concerns.map((item) => (
            <motion.div
              key={item.id}
              variants={cardVariants}
              whileHover="hover"
              onClick={() => handleCardClick(item.queryParam)}
              className="relative w-full h-[350px] md:h-full rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-shadow duration-500 bg-gray-100 group"
            >
              {/* 1. Image Background - ALWAYS VISIBLE */}
              <motion.div
                className="absolute inset-0 z-0"
                variants={{
                  hover: { scale: 1.1 }, 
                }}
                initial={{ scale: 1 }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
              >
                <div className="w-full h-full relative">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  {/* Dark Overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-500" />
                </div>
              </motion.div>

              {/* 2. Content Layer */}
              <div className="relative h-full flex flex-col justify-between p-8 z-10 pointer-events-none">
                
                {/* Top: Icon */}
                <div className="flex justify-between items-start">
                  <motion.div
                    className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md bg-white/20 text-white shadow-sm transition-all duration-500 group-hover:bg-white group-hover:text-black"
                  >
                    {item.icon}
                  </motion.div>

                  <motion.div
                    variants={{
                      hover: { x: 5, y: -5, opacity: 1 },
                    }}
                    initial={{ x: 0, y: 0, opacity: 0.7 }}
                    className="w-10 h-10 rounded-full border border-white/30 text-white flex items-center justify-center backdrop-blur-md"
                  >
                    <ArrowUpRight className="w-5 h-5" />
                  </motion.div>
                </div>

                {/* Bottom: Text */}
                <motion.div
                  variants={{
                    hover: { y: -5 },
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <h3 className="text-2xl font-serif text-white mb-2 transition-colors duration-500">
                    {item.title}
                  </h3>

                  <p className="text-gray-200 text-sm leading-relaxed transition-colors duration-500 font-medium">
                    {item.subtitle}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ShopByConcernFinal;