import React from 'react';
import Image from 'next/image';
import Link from 'next/link'; // 1. Import the Link component

const HeevasCareSection = () => {
  return (
    // Main container with the specific light grey background color
    <section className="bg-[#f5f5f5] w-full py-20 px-6 md:px-12 lg:px-20">
      <div className="max-w-300 mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
          
          {/* Left Side: Image */}
          <div className="w-full md:w-1/2">
            <div className="overflow-hidden relative w-full h-auto">
              <Image 
                src="/BG1.webp" 
                alt="Heevas Hair Care Model" 
                width={600}
                height={600}
                className="w-full h-auto object-cover block"
              />
            </div>
          </div>

          {/* Right Side: Content */}
          <div className="w-full md:w-1/2 flex flex-col justify-center">
            {/* Heading with exact spacing and font weight style */}
            <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.1] text-black font-normal mb-8 tracking-tight">
              Personal <br />
              Help for Hair Care
            </h2>
            
            {/* Paragraph Content */}
            <p className="text-gray-500 text-sm md:text-[15px] leading-7 mb-4 max-w-md font-light">
              We are Heevas Cosmetics, dedicated to revitalizing your hair. 
              Our natural formulas are designed to nourish roots and restore shine.
            </p>
            
            <p className="text-gray-500 text-sm md:text-[15px] leading-7 mb-10 max-w-md font-light">
              Whether you need repair, volume, or hydration, we help you choose 
              the perfect product. Experience the transformation with Heevas 
              today.
            </p>

            {/* 2. Replaced <button> with <Link> */}
            <div>
              <Link 
                href="/pages/contact"
                className="inline-block border border-black bg-transparent text-black text-[11px] md:text-xs font-semibold tracking-[0.25em] uppercase px-10 py-4 hover:bg-black hover:text-white transition-colors duration-300 ease-in-out"
              >
                Contact
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeevasCareSection;