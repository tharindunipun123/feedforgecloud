/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['ssh2', 'stripe'],
};

module.exports = nextConfig;
