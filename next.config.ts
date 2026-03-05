import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  // firebase-admin uses native Node modules (@opentelemetry, gRPC, etc.)
  // that must NOT be bundled by Turbopack — require them at runtime instead.
  serverExternalPackages: [
    'firebase-admin',
    '@google-cloud/firestore',
    '@google-cloud/storage',
    '@opentelemetry/api',
    'google-gax',
  ],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },

  experimental: {
    // optimizePackageImports: ['lucide-react', 'framer-motion'],
  }
};

export default nextConfig;

