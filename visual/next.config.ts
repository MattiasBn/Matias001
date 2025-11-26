/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Usar standalone apenas se realmente for usar corretamente no Render
  output: "standalone",

  images: {
    domains: ['www.google.com'], 
  },
};

module.exports = nextConfig;
