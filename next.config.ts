import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["172.16.17.160", "localhost","192.168.56.1"],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3080",
  },
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: "http://localhost:3080/api/:path*",
      },
    ];
  },
};

export default nextConfig;
