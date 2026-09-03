import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The in-app browser opens the local site via 127.0.0.1 while Next runs on localhost.
  // Allow that development origin so HMR and client chunks load correctly.
  allowedDevOrigins: ['127.0.0.1'],
  async headers() {
    const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : '';
    const contentSecurityPolicy = [
      "default-src 'self'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'", "object-src 'none'",
      "img-src 'self' data: blob: https:", "font-src 'self' https://fonts.gstatic.com data:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `connect-src 'self' ${supabaseOrigin}`.trim(),
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
      "upgrade-insecure-requests",
    ].join('; ');
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: contentSecurityPolicy },
    ];
    return [
      { source: '/(.*)', headers: securityHeaders },
      { source: '/client/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store, max-age=0' }] },
      { source: '/admin/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store, max-age=0' }] },
    ];
  },
};

export default nextConfig;
