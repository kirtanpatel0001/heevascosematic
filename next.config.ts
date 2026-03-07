import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Your existing settings
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
  },

  // THE FIX: Add headers to prevent browsers from caching old HTML
  async headers() {
    return [
      {
        // Avoid caching auth/admin HTML where stale session or chunk references hurt UX.
        source: '/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate', 
          },
        ],
      },
      {
        source: '/auth/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/authntication/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        // Apply these headers to static assets (JS, CSS, Images)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            // This tells the browser: "These files have unique hashes in their names, so keep them forever."
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
