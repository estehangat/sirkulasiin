import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.trycloudflare.com", "*.ngrok-free.dev"],
  experimental: {
    serverActions: {
      allowedOrigins: ["*.trycloudflare.com", "*.ngrok-free.dev"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/aida-public/**",
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
