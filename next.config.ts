import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config: any) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "tailwindcss": path.resolve(__dirname, "node_modules/tailwindcss"),
    };
    return config;
  },
  turbopack: {},
} as any;

export default nextConfig;
