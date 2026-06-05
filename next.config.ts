import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allows images from any HTTPS host (Notion CDN, external URLs, etc.).
    // In production you can tighten this to specific hostnames, e.g.:
    //   { protocol: "https", hostname: "*.amazonaws.com" }
    //   { protocol: "https", hostname: "www.notion.so" }
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
