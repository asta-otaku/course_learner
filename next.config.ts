import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Parent-directory yarn.lock would otherwise make Next treat ~ as the app root
  // and fail collecting page data with "Cannot find module for page: /_document".
  outputFileTracingRoot: path.join(__dirname),
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'leaplearndev.s3.eu-west-2.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'd3fuwo84h3jths.cloudfront.net',
        pathname: '/**',
      },
      // Allow any CloudFront distribution
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
        pathname: '/**',
      },
      // Allow any AWS S3 bucket
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: ["http://localhost:3000", "*"],
};

export default nextConfig;
