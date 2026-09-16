import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Platform packages ship TypeScript source, so Next compiles them alongside the app.
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
