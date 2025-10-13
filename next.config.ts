import type { NextConfig } from "next";

// Check if running in CI with demo env
const isCI = process.env.CI === 'true' && process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('example');

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  poweredByHeader: false,
  compress: true,
  optimizeFonts: true,
  swcMinify: true,
  outputFileTracingRoot: __dirname,
  // Skip static generation in CI
  ...(isCI && { 
    experimental: {
      isrMemoryCacheSize: 0,
    },
  }),
  async redirects() {
    return [
      { 
        source: "/loghin", 
        destination: "/login", 
        permanent: false 
      },
      {
        source: "/home",
        destination: "/",
        permanent: true
      }
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options", 
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { 
        protocol: "https", 
        hostname: "res.cloudinary.com" 
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https", 
        hostname: "developers.google.com"
      }
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;