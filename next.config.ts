import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
