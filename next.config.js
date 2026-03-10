/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "img-src 'self' data: blob: https: https://i.scdn.co https://mosaic.scdn.co https://firebasestorage.googleapis.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://*.googleusercontent.com https://picsum.photos https://i.ytimg.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com",
  "font-src 'self' https: data:",
  "style-src 'self' 'unsafe-inline' https:",
  `script-src 'self' 'unsafe-inline' https: blob: ${isProd ? '' : "'unsafe-eval'"}`.trim(),
  "connect-src 'self' https: ws: wss: https://api.spotify.com https://accounts.spotify.com https://api.open-meteo.com https://geocoding-api.open-meteo.com https://*.googleapis.com https://*.firebaseio.com https://firestore.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com",
  "frame-src 'self' https: data: blob:",
  "form-action 'self'",
];

if (isProd) {
  cspDirectives.push('upgrade-insecure-requests');
}

const contentSecurityPolicy = cspDirectives.join('; ');

const nextConfig = {
  /* config options here */
  compress: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async headers() {
    const securityHeaders = [
      {
        key: 'Content-Security-Policy',
        value: contentSecurityPolicy,
      },
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
    ];

    if (isProd) {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=15552000; includeSubDomains',
      });
    }

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'react-icons',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
    ],
    serverActions: {
      allowedOrigins: ["6000-firebase-studio-1771843648541.cluster-64pjnskmlbaxowh5lzq6i7v4ra.cloudworkstations.dev"]
    }
  },
  allowedDevOrigins: [
      "6000-firebase-studio-1771843648541.cluster-64pjnskmlbaxowh5lzq6i7v4ra.cloudworkstations.dev",
      "9000-firebase-studio-1771843648541.cluster-64pjnskmlbaxowh5lzq6i7v4ra.cloudworkstations.dev"
    ]
};

module.exports = nextConfig;
