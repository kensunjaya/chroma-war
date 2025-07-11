import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
