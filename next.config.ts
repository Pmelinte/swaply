import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Do not run ESLint during production builds (e.g., on Vercel)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;