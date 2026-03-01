import type { NextConfig } from "next";
import path from "path";

const SHORTHAND_PATHS = [
  "leads",
  "students",
  "agents",
  "employees",
  "applications",
  "visa-applications",
  "dashboard",
  "master",
  "roles",
  "profile",
  "file-manager",
  "addstudent",
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return SHORTHAND_PATHS.map((p) => ({
      source: `/${p}`,
      destination: `/admin/${p}`,
      permanent: false,
    }));
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
