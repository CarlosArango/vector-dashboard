import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@vector/ui',
    '@vector/domain',
    '@vector/infrastructure',
    '@vector/validation',
  ],
  serverExternalPackages: ['postgres'],
};

export default nextConfig;
