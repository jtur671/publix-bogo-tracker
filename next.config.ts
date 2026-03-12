import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.wishabi.com",
      },
      {
        protocol: "https",
        hostname: "**.flippback.com",
      },
      {
        protocol: "https",
        hostname: "f.wishabi.net",
      },
    ],
  },
};

export default nextConfig;
