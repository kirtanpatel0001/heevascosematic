'use client';

import Link from 'next/link';

export default function Privacy() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 mb-8 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-light text-gray-900" style={{ fontFamily: 'Didot, Georgia, serif' }}>
            Privacy Policy
          </h1>
          <p className="text-gray-600 mt-4">Last updated: January 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-gray-700">
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
          <p className="leading-relaxed mb-4">
            Heevas ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
          <p className="leading-relaxed mb-4">
            We may collect information about you in a variety of ways. The information we may collect on the Site includes:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Personal identification information (name, email address, phone number, etc.)</li>
            <li>Billing and shipping addresses</li>
            <li>Payment information</li>
            <li>Browsing history and preferences</li>
            <li>Device information and IP address</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
          <p className="leading-relaxed mb-4">
            Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Process your transactions and send related information</li>
            <li>Email regarding your account or order</li>
            <li>Improve our website and services</li>
            <li>Respond to your inquiries and offer customer support</li>
            <li>Send you marketing and promotional communications</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Security of Your Information</h2>
          <p className="leading-relaxed mb-4">
            We use administrative, technical, and physical security measures to protect your personal information. However, no method of transmission over the Internet or method of electronic storage is 100% secure.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
          <p className="leading-relaxed">
            If you have questions or comments about this Privacy Policy, please contact us at:
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <p><strong>Email:</strong> support@heevas.com</p>
            <p><strong>Phone:</strong> +91 95200 43200</p>
            <p><strong>Address:</strong> 5, Doctor Ni Wadi, B/h Krishna Petrol Pump, Khatodra, Udhna-395002</p>
          </div>
        </section>
      </div>
    </main>
  );
}
