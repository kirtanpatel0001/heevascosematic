import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export",  <-- DELETED THIS
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
  },
};

export default nextConfig;