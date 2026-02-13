'use client'

import React, { useState, FC } from 'react'
import Image from 'next/image'
import { Facebook, Instagram } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCheck, FiX } from 'react-icons/fi'

// Updated data
// Updated data with WORKING Google Maps Links
const locations = {
  'SURAT': {
    label: 'SURAT (EXHUB)',
    phones: ['+91 95200 43200'],
    address: [
      '5, Doctor Ni Wadi,', 
      'B/h Krishna Petrol Pump,', 
      'Khatodra, Udhna,',
      'Surat - 395002'
    ],
    email: 'support@heevas.com',
    // FIXED: Real Map Link for Doctor Ni Wadi, Surat
    mapSrc: "https://maps.google.com/maps?q=5,+Doctor+Ni+Wadi,+Behind+Krishna+Petrol+Pump,+Khatodra,+Udhna,+Surat&t=&z=15&ie=UTF8&iwloc=&output=embed"
  },
  'MOTA VARACHA': {
    label: 'MOTA VARACHA',
    phones: ['+91 95200 43200'],
    address: [
      'A-12, Sumeru City Mall,', 
      'Sudama Chowk,', 
      'Mota Varachha,', 
      'Surat, Gujarat 394101'
    ],
    email: 'support@heevas.com',
    // FIXED: Real Map Link for Sumeru City Mall
    mapSrc: "https://maps.google.com/maps?q=Sumeru+City+Mall,+Sudama+Chowk,+Mota+Varachha,+Surat&t=&z=15&ie=UTF8&iwloc=&output=embed"
  }
}

// Toast Component
const Toast: FC<{
  show: boolean
  type: 'success' | 'error' | string
  message: string
  onClose: () => void
}> = ({ show, type, message, onClose }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -50, x: "-50%" }}
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-lg shadow-xl border backdrop-blur-md ${
            type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
              : 'bg-red-50 text-red-900 border-red-300'
          }`}
        >
          <div className="flex items-center space-x-3">
            {type === 'success' ? (
              <FiCheck className="w-5 h-5 text-emerald-600" />
            ) : (
              <FiX className="w-5 h-5 text-red-600" />
            )}
            <span className="font-medium text-sm">{message}</span>
            <button
              onClick={onClose}
              className="ml-4 hover:opacity-75 transition-opacity"
            >
              <FiX className={`w-4 h-4 ${type === 'success' ? 'text-emerald-600' : 'text-red-600'}`} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function ContactPage() {
  const [activeTab, setActiveTab] = useState<'SURAT' | 'MOTA VARACHA'>('SURAT')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastType, setToastType] = useState<'success' | 'error' | string>('')
  const [toastMessage, setToastMessage] = useState('')
  
  const currentData = locations[activeTab]

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      
      // Convert FormData to JSON for better reliability
      const data = Object.fromEntries(formData.entries());

      // Submit to FormSubmit (Using JSON endpoint for real error handling)
      const response = await fetch('https://formsubmit.co/ajax/heevascosmetics@gmail.com', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            ...data,
            _subject: 'New Contact Form Submission',
            _captcha: 'false'
        })
      })
      
      const result = await response.json();

      if (response.ok) {
          setShowToast(true);
          setToastType('success');
          setToastMessage("Thank you! Your message has been sent successfully.");
          form.reset();
      } else {
          throw new Error(result.message || 'Something went wrong');
      }
      
    } catch (error) {
      console.error('Form submission error:', error)
      setShowToast(true)
      setToastType('error')
      setToastMessage('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
      setTimeout(() => {
        setShowToast(false)
      }, 5000)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] font-sans">
      
      <Toast 
        show={showToast} 
        type={toastType} 
        message={toastMessage} 
        onClose={() => setShowToast(false)}
      />
      
      {/* 1. LOCATION TABS */}
      <div className="flex justify-center items-center py-16 bg-[#f7f7f7]">
        <div className="flex space-x-12 text-xs font-bold tracking-widest text-gray-400 uppercase">
          {Object.keys(locations).map((city) => (
            <button
              key={city}
              onClick={() => setActiveTab(city as 'SURAT' | 'MOTA VARACHA')}
              className={`pb-2 border-b-2 transition-colors duration-300 ${
                activeTab === city 
                  ? 'border-black text-black' 
                  : 'border-transparent hover:text-gray-600'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-20 space-y-8">
        
        {/* 2. LOCATION DETAILS + MAP */}
        <div className="flex flex-col md:flex-row bg-white shadow-sm min-h-[500px]">
          {/* Left: Info */}
          <div className="w-full md:w-1/2 p-12 lg:p-16 flex flex-col justify-center">
            <h2 className="text-2xl font-medium tracking-widest uppercase mb-12 text-gray-800">
              {activeTab}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-8">
              {/* Phones */}
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Phones</h4>
                <div className="text-sm text-gray-500 font-light space-y-1">
                  {currentData.phones.map((phone, i) => <p key={i}>{phone}</p>)}
                </div>
              </div>

              {/* Address */}
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Address</h4>
                <div className="text-sm text-gray-500 font-light space-y-1">
                   {currentData.address.map((line, i) => <p key={i}>{line}</p>)}
                </div>
              </div>

              {/* Email */}
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Email</h4>
                <p className="text-sm text-gray-500 font-light">{currentData.email}</p>
              </div>

              {/* Socials */}
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Social Networks</h4>
                <div className="flex space-x-4 text-black">
                  <a href="https://www.facebook.com/profile.php?id=61568964374493" target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:text-gray-600 transition-colors">
                    <Facebook size={16} />
                  </a>
                  <a href="https://www.instagram.com/heevas_cosmetics_/?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:text-gray-600 transition-colors">
                    <Instagram size={16} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Map */}
          <div className="w-full md:w-1/2 bg-gray-200 relative min-h-[300px] md:min-h-full">
             <iframe 
               src={currentData.mapSrc} 
               className="absolute z-10 inset-0 w-full h-full border-0 opacity-90 hover:grayscale-0 transition-all duration-500"
               allowFullScreen 
               loading="lazy" 
               referrerPolicy="no-referrer-when-downgrade"
             ></iframe>
          </div>
        </div>

        {/* 3. CONTACT FORM SECTION */}
        <div className="flex flex-col md:flex-row bg-white shadow-sm min-h-[500px]">
          {/* Left: Image */}
          <div className="w-full md:w-1/2 relative bg-gray-100 min-h-[300px] md:min-h-full">
            <Image 
              src="/imges/gg.jpg" // NOTE: Ensure folder is named 'imges' or 'images'
              alt="Cosmetic bottle with flowers"
              fill
              // PERFORMANCE FIX: This tells mobile to download small version, Desktop large version
              sizes="(max-width: 768px) 100vw, 50vw" 
              className="object-cover"
              priority={false} // Lazy load since it's at the bottom
            />
          </div>

          {/* Right: Form */}
          <div className="w-full md:w-1/2 p-12 lg:p-16 flex flex-col justify-center">
            <h2 className="text-xl font-medium tracking-widest uppercase mb-10 text-gray-800">
               Send Us Your Question
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input 
                  type="text" 
                  name="name"
                  placeholder="Your name" 
                  required
                  className="w-full text-black bg-gray-100 border-none p-4 text-sm outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-400"
                />
              </div>
              <div>
                <input 
                  type="email" 
                  name="email"
                  placeholder="Your email" 
                  required
                  className="w-full text-black bg-gray-100 border-none p-4 text-sm outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-400"
                />
              </div>
              <div>
                <textarea 
                  name="message"
                  rows={4} 
                  placeholder="Your message" 
                  required
                  className="w-full text-black bg-gray-100 border-none p-4 text-sm outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-400 resize-none"
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full bg-black text-white text-xs font-bold uppercase tracking-widest py-4 hover:bg-gray-800 transition-colors flex items-center justify-center ${
                  isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  'Send'
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}