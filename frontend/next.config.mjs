/** @type {import('next').NextConfig} */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
const sanitizedApiBase = API_BASE.replace(/\/$/, '');
const apiDestinationBase = sanitizedApiBase.endsWith('/api')
  ? sanitizedApiBase
  : `${sanitizedApiBase}/api`;

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiDestinationBase}/:path*`
      }
    ];
  }
};

export default nextConfig;
