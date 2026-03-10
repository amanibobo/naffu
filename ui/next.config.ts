import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // BlockNote compatibility
  output: "export", // Static export for serving from naffu CLI
};

export default nextConfig;
