import type { NextConfig } from 'next';

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data:;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' wss:;
      frame-ancestors 'none';
      require-trusted-types-for 'script';
    `.replace(/\n/g, ""), // remove newlines
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
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
