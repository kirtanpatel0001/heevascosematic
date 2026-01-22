'use client';

import Link from 'next/link';

export default function Terms() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 mb-8 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-light text-gray-900" style={{ fontFamily: 'Didot, Georgia, serif' }}>
            Terms & Conditions
          </h1>
          <p className="text-gray-600 mt-4">Last updated: January 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-gray-700">
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceptance of Terms</h2>
          <p className="leading-relaxed mb-4">
            By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Use License</h2>
          <p className="leading-relaxed mb-4">
            Permission is granted to temporarily download one copy of the materials (information or software) on Heevas's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Modifying or copying the materials</li>
            <li>Using the materials for any commercial purpose or for any public display</li>
            <li>Attempting to decompile or reverse engineer any software contained on the website</li>
            <li>Removing any copyright or other proprietary notations from the materials</li>
            <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Disclaimer</h2>
          <p className="leading-relaxed mb-4">
            The materials on Heevas's website are provided on an "as is" basis. Heevas makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitations</h2>
          <p className="leading-relaxed mb-4">
            In no event shall Heevas or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Heevas's website.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accuracy of Materials</h2>
          <p className="leading-relaxed mb-4">
            The materials appearing on Heevas's website could include technical, typographical, or photographic errors. Heevas does not warrant that any of the materials on the website are accurate, complete, or current.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Links</h2>
          <p className="leading-relaxed mb-4">
            Heevas has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Heevas of the site. Use of any such linked website is at the user's own risk.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Modifications</h2>
          <p className="leading-relaxed mb-4">
            Heevas may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
          <p className="leading-relaxed">
            These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>
        </section>
      </div>
    </main>
  );
}
