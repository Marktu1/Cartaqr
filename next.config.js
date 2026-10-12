/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  output: 'standalone',
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  webpack: (config, { isServer }) => {
    config.resolve.alias['@'] = require('path').join(__dirname, 'src');
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({ 'node:sqlite': 'commonjs node:sqlite' });
    }
    return config;
  },
  async headers() {
    const prod = process.env.NODE_ENV === 'production';
    const base = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'X-DNS-Prefetch-Control', value: 'off' },
      { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
      ...(prod ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }] : []),
    ];
    // Páginas com dados privados: nunca guardadas em caches partilhadas nem no histórico do browser.
    const privateNoStore = [{ key: 'Cache-Control', value: 'private, no-store, max-age=0' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
    return [
      { source: '/(.*)', headers: base },
      { source: '/carta/:path*', headers: privateNoStore },
      { source: '/minha/:path*', headers: privateNoStore },
      { source: '/admin/:path*', headers: privateNoStore },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
};
module.exports = nextConfig;
