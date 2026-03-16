import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false, // Disabled: was causing production-only bugs (add-game modal: opponent label, Away colors, Cup Championship not updating)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.nba.com',
        pathname: '/logos/**',
      },
    ],
  },
};

export default nextConfig;
