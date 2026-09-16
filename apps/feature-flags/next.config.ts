import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@platform/audit',
    '@platform/auth',
    '@platform/db',
    '@platform/rbac',
    '@platform/resource',
    '@platform/ui',
  ],
};

export default nextConfig;
