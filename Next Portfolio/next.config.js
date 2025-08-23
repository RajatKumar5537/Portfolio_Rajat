/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com'],
  },
  trailingSlash: false,
  output: 'export',
}

module.exports = nextConfig;
