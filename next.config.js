/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Cloudflare Pages suporta Static Export
  output: 'export',
  // Desabilitar imagem otimizada (Cloudflare não suporta on-demand)
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;