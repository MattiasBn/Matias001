/** @type {import('next').NextConfig} */
const nextConfig = {
  // outras configurações aqui...

  output: "standalone", // ✅ importante para Render
  reactStrictMode: true,
  experimental: {
    appDir: true,
          },

   images: {
    domains: ['www.google.com'], // Adicione outros domínios de imagens externas aqui
  },
  
  allowedDevOrigins: [
    '192.168.137.1', 
    '*', // Adicione o seu endereço IP aqui
    'https://Sismatias.onrender.com'
  
  ]
};

module.exports = nextConfig;