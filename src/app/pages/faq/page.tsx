'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What products does Heevas offer?",
      answer: "Heevas offers premium hair care products including hair oils, shampoos, conditioners, hair masks, and hair cleansers. All our products are carefully formulated with natural ingredients to provide the best care for your hair."
    },
    {
      question: "Are your products cruelty-free?",
      answer: "Yes, Heevas is committed to cruelty-free practices. Our products are not tested on animals and we ensure ethical sourcing of all ingredients."
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy on all unopened products. If you're not satisfied with your purchase, you can return it within 30 days for a full refund. Please contact our support team for return instructions."
    },
    {
      question: "How do I place an order?",
      answer: "You can place an order directly through our website. Browse our products, add items to your cart, and proceed to checkout. We accept all major payment methods including credit cards, debit cards, and digital wallets."
    },
    {
      question: "What is the shipping time?",
      answer: "We offer fast and reliable shipping. Most orders are delivered within 5-7 business days within India. International shipping is also available with varying delivery times depending on your location."
    },
    {
      question: "Do you offer gift wrapping?",
      answer: "Yes, we offer complimentary gift wrapping for orders placed as gifts. You can select this option during checkout and add a personalized message if desired."
    },
    {
      question: "How do I track my order?",
      answer: "Once your order is shipped, you'll receive a tracking number via email. You can use this number to track your shipment in real-time on our website or the courier's platform."
    },
    {
      question: "Are your products suitable for all hair types?",
      answer: "Yes, our products are formulated to be suitable for all hair types. However, we recommend reading the product descriptions to find the best option for your specific hair concerns."
    },
    {
      question: "Can I contact customer support?",
      answer: "Absolutely! You can reach our customer support team via email at support@heevas.com or call us at +91 95200 43200. We're available Monday to Saturday from 10:00 AM to 7:00 PM."
    },
    {
      question: "Do you offer bulk orders or wholesale?",
      answer: "Yes, we do accept bulk orders and wholesale inquiries. Please contact our sales team at support@heevas.com for wholesale pricing and terms."
    }
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 mb-8 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-light text-gray-900" style={{ fontFamily: 'Didot, Georgia, serif' }}>
            Frequently Asked Questions
          </h1>
          <p className="text-gray-600 mt-4">Find answers to common questions about Heevas products and services</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-left font-semibold text-gray-900">{faq.question}</h3>
                <ChevronDown
                  size={20}
                  className={`text-gray-600 flex-shrink-0 ml-4 transition-transform duration-300 ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-16 p-8 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Didn't find your answer?</h2>
          <p className="text-gray-700 mb-4">
            If you have any other questions, feel free to reach out to our customer support team.
          </p>
          <div className="space-y-2 text-sm">
            <p><strong>Email:</strong> <a href="mailto:support@heevas.com" className="text-blue-600 hover:text-blue-800">support@heevas.com</a></p>
            <p><strong>Phone:</strong> <a href="tel:+919520043200" className="text-blue-600 hover:text-blue-800">+91 95200 43200</a></p>
            <p><strong>Hours:</strong> Mon-Sat: 10:00 AM - 7:00 PM</p>
          </div>
        </div>
      </div>
    </main>
  );
}
