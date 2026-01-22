'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Phone, MapPin, Mail, Clock, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export default function Footer() {
  // Automatically gets the current year
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#050505] text-gray-400 font-sans border-t border-white/10 relative overflow-hidden">
      
      {/* BACKGROUND PATTERN */}
      <div 
        className="absolute inset-0 z-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z' fill='none' stroke='%23333' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />
      
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      {/* CONTENT */}
      <div className="relative z-10">
        
        {/* MIDDLE SECTION: 3 Columns */}
        <div className="border-b border-white/10">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3">
            
            {/* LEFT COLUMN: Contact Details */}
            <div className="py-16 px-4 md:pl-0 md:pr-12 flex flex-col justify-center items-center md:items-start space-y-4">
              <div className="flex items-start gap-4 text-[11px] tracking-widest text-white">
                <Phone size={14} className="mt-0.5 text-gray-400" />
                <span>+91 95200 43200</span>
              </div>
              <div className="flex items-start gap-4 text-[11px] tracking-widest text-white">
                <MapPin size={14} className="mt-0.5 text-gray-400" />
                <span className="max-w-[250px] leading-relaxed">
                  5, Doctor Ni Wadi, B/h Krishna Petrol Pump, Khatodra, Udhna-395002
                </span>
              </div>
              <div className="flex items-start gap-4 text-[11px] tracking-widest text-white">
                <Mail size={14} className="mt-0.5 text-gray-400" />
                <span>support@heevas.com</span>
              </div>
              <div className="flex items-start gap-4 text-[11px] tracking-widest text-white">
                <Clock size={14} className="mt-0.5 text-gray-400" />
                <span>Mon-Sat: 10:00 - 19:00</span>
              </div>
            </div>

            {/* CENTER COLUMN: Logo & Socials */}
            <div className="py-16 px-4 flex flex-col justify-center items-center space-y-8">
              <Link href="/" className="text-5xl font-light text-white tracking-[0.1em] hover:opacity-80 transition-opacity" style={{ fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.05em' }}>
                Heevas
              </Link>
              
              <div className="flex items-center gap-6 text-white/80">
                <a href="https://www.facebook.com/profile.php?id=61568964374493" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Facebook size={16} /></a>
                
                                <a href="https://www.instagram.com/heevas_cosmetics_/?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Instagram size={16} /></a>
              </div>
            </div>

            {/* RIGHT COLUMN: Description */}
            <div className="py-16 px-4 md:pl-12 md:pr-0 flex flex-col justify-center items-center md:items-end text-center md:text-right space-y-6">
              <p className="text-gray-500 text-[11px] leading-6 tracking-wide max-w-[280px]">
                Discover EXHUB by Heevas. We are committed to providing premium quality products and services tailored to your lifestyle.
              </p>
              {/* <Link 
                href="/about" 
                className="text-[10px] font-bold text-white uppercase tracking-[0.2em] border-b border-white/20 pb-1 hover:border-white transition-all"
              >
                Read More
              </Link> */}
            </div>

          </div>
        </div>

        {/* BOTTOM ROW: Dynamic Copyright */}
        <div className="max-w-[1400px] mx-auto py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-gray-600 font-bold uppercase tracking-[0.15em] px-4 md:px-0">
          <div>
            © {currentYear} Heevas. All rights reserved.
          </div>
          <div className="flex gap-6">
            <Link href="/pages/privacy"  className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link href="/pages/terms"  className="hover:text-white transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/pages/faq"  className="hover:text-white transition-colors">FAQ</Link>
            <span>·</span>
            <Link href="/pages/shipping-policy" className="hover:text-white transition-colors">Shipping Policy</Link>
            <span>·</span>
            <Link href="/pages/cancellations-and-refunds" className="hover:text-white transition-colors">Cancellations & Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}