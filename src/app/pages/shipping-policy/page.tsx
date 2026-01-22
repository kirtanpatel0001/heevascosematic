 'use client';

import Link from 'next/link';

export default function ShippingPolicy() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 mb-8 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-light text-gray-900" style={{ fontFamily: 'Didot, Georgia, serif' }}>
            Shipping Policy
          </h1>
          <p className="text-gray-600 mt-4">Last updated: January 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 text-gray-700">
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
          <p className="leading-relaxed mb-4">
            We aim to process and ship orders promptly. This Shipping Policy explains estimated processing times, delivery methods, shipping costs, and tracking information.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Processing Time</h2>
          <p className="leading-relaxed mb-4">Orders are typically processed within 1–3 business days. During sales or peak periods processing may take longer.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Shipping Methods & Delivery Time</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Standard Shipping: 5–10 business days.</li>
            <li>Express Shipping: 2–4 business days.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Shipping Costs</h2>
          <p className="leading-relaxed mb-4">Shipping costs depend on the selected shipping method and delivery address. Exact charges are shown at checkout.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Tracking</h2>
          <p className="leading-relaxed mb-4">Once your order ships, you will receive a confirmation email with tracking details. If you do not receive tracking information, contact our support team.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
          <p className="leading-relaxed">For questions about shipping, please email support@heevas.com or call +91 95200 43200.</p>
        </section>
      </div>
    </main>
  );
}
