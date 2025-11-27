

/**@type {import ('next' ).NextConfig;} */

const  nextConfig = {
  output: "standalone",

  experimental: {
    optimizePackageImports :[

      '@mui/material','@mui/icons-material'
    ],
  },
  reactStrictMode: true,
  images: {
    domains: ["www.google.com"], // podes adicionar outras quando precisar
  },
};

export default nextConfig;
