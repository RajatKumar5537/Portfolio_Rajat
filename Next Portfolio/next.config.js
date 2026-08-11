/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: true,
  },
  trailingSlash: true,
  output: 'export',
  basePath: '/Portfolio_Rajat',
}

module.exports = nextConfig;
