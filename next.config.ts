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
  // Keep serverless bundles lean — do not ship the whole image corpus.
  outputFileTracingExcludes: {
    "*": [
      "./images/**",
      "./nehasa/**",
      "./docs/**",
      "./supabase/scripts/**",
      "./public/brand/dhel-logo-3d.png",
      "./public/brand/dhel-logo-bhutan-3d.png",
      "./public/brand/dhel-logo-ivory-3d.png",
      "./public/brand/dhel-logo-natural-3d.png",
      "./public/brand/dhel-logo-royal-3d.png",
      "./public/brand/dhel-logo-tigersnest-3d.png",
      "./public/brand/dhel-mark-3d.png",
    ],
  },
};

export default nextConfig;
