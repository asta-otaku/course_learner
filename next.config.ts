import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'leaplearndev.s3.eu-west-2.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: ["http://localhost:3000", "*"],
};

export default nextConfig;
