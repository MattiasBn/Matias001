import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    domains: ["www.google.com"], // podes adicionar outras quando precisar
  },
};

export default nextConfig;
