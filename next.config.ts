import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // @ts-expect-error - allowedDevOrigins is in preview and not yet in types
    allowedDevOrigins: ['127.0.0.1', 'localhost', '0.0.0.0'],
  },
};

export default nextConfig;
