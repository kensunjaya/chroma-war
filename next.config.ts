import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  async redirects() {
    return [
      {
        source: '/minimax',
        destination: '/singleplayer',
        permanent: true,
      },
      {
        source: '/',
        destination: '/singleplayer',
        permanent: true,
      },
      {
        source: '/versusai',
        destination: '/singleplayer',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
