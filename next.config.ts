import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.104", "localhost:3000"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Kapıları 10 MB'a kadar sonuna kadar açtık
    },
  },
};

export default nextConfig;