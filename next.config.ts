import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.ngrok.app",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "*.trycloudflare.com",
        "*.ngrok-free.app",
        "*.ngrok.io",
        "*.ngrok.app",
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "jhqoahagvybqulqgfuxn.supabase.co",
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;
