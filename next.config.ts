import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@cursor/sdk"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
