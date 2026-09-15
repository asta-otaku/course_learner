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
        protocol: "https",
        hostname: "leaplearndev.s3.eu-west-2.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "d3fuwo84h3jths.cloudfront.net",
        pathname: "/**",
      },
    ],
  },
  allowedDevOrigins: ["http://localhost:3000"],
};

export default nextConfig;
