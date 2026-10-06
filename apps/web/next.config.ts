import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@kuripp/shared-types'],
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_API_URL ||
      process.env.BACKEND_INTERNAL_URL ||
      'http://localhost:4000';

    return [
      {
        source: '/graphql',
        destination: `${backendUrl}/graphql`,
      },
    ];
  },
};

export default nextConfig;
