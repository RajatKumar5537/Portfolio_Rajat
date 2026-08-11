/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: true,
  },
  trailingSlash: true,
  output: 'export',
  basePath: isProd ? '/Portfolio_Rajat' : '',
}

module.exports = nextConfig;
