 'use client';

import Link from 'next/link';

export default function CancellationsAndRefunds() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 mb-8 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-light text-gray-900" style={{ fontFamily: 'Didot, Georgia, serif' }}>
            Cancellations & Refunds
          </h1>
          <p className="text-gray-600 mt-4">Last updated: January 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 text-gray-700">
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Cancellations</h2>
          <p className="leading-relaxed mb-4">You may cancel your order within 24 hours of placing it. To request a cancellation, contact support as soon as possible. We cannot cancel orders that have already shipped.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Returns & Refunds</h2>
          <p className="leading-relaxed mb-4">If you receive a defective or incorrect item, please contact us within 7 days to arrange a return and refund. Refunds are processed after we receive and inspect the returned item.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Refund Processing Time</h2>
          <p className="leading-relaxed mb-4">Once approved, refunds may take 5–10 business days to appear on your original payment method, depending on the payment provider.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
          <p className="leading-relaxed">For cancellations or refund requests, email support@heevas.com or call +91 95200 43200.</p>
        </section>
      </div>
    </main>
  );
}
