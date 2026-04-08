/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  compress: true,

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  // === Imágenes remotas (sin cambios, solo organizado) ===
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'i.scdn.co' },
      { protocol: 'https', hostname: 'mosaic.scdn.co' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'cdn.osxdaily.com' },
      { protocol: 'https', hostname: '*.imgcdn.dev' },
      { protocol: 'https', hostname: 's6.imgcdn.dev' },
      { protocol: 'https', hostname: 'cdn.danielcabrera.es' },
      { protocol: 'https', hostname: '*.tile.openstreetmap.org' },
      { protocol: 'https', hostname: '*.basemaps.cartocdn.com' },
    ],
  },

  // === HEADERS DE SEGURIDAD (mejorado) ===
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Permissions Policy (Feature Policy)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=(), payment=()',
          },

          // Cabeceras clásicas de seguridad
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

          // HSTS solo en producción
          ...(isProd
            ? [
              {
                key: 'Strict-Transport-Security',
                value: 'max-age=15552000; includeSubDomains; preload',
              },
            ]
            : []),
        ],
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
      allowedOrigins: [
        "6000-firebase-studio-1771843648541.cluster-64pjnskmlbaxowh5lzq6i7v4ra.cloudworkstations.dev",
      ],
    },
  },

  // Origenes permitidos en dev (Firebase Studio)
  allowedDevOrigins: [
    "6000-firebase-studio-1771843648541.cluster-64pjnskmlbaxowh5lzq6i7v4ra.cloudworkstations.dev",
    "9000-firebase-studio-1771843648541.cluster-64pjnskmlbaxowh5lzq6i7v4ra.cloudworkstations.dev",
  ],
};

module.exports = nextConfig;