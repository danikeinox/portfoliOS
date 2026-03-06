import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { I18nProvider } from '@/hooks/use-i18n';
import { WallpaperProvider } from '@/hooks/use-wallpaper';
import { NotificationsProvider } from '@/hooks/use-notifications';
import { SystemStateProvider } from '@/hooks/use-system-state';
import { HomeScreenProvider } from '@/hooks/use-home-screen';
import { ThemeProvider } from '@/hooks/use-theme';
import { GoogleCalendarProvider } from '@/hooks/use-google-calendar';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'),
  title: {
    default: 'Daniel Cabrera | Portfolio iOS',
    template: '%s | Daniel Cabrera',
  },
  description: 'Portfolio interactivo de Daniel Cabrera con experiencia iOS: proyectos frontend, apps reales, integración Firebase, SEO técnico y contacto profesional.',
  applicationName: 'Daniel Cabrera Portfolio',
  keywords: ['Daniel Cabrera', 'portfolio', 'frontend', 'next.js', 'iOS web', 'web developer'],
  authors: [{ name: 'Daniel Cabrera' }],
  creator: 'Daniel Cabrera',
  publisher: 'Daniel Cabrera',
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: '/',
    title: 'Daniel Cabrera | Portfolio iOS',
    description: 'Portfolio interactivo de Daniel Cabrera con experiencia iOS: proyectos frontend, apps reales, integración Firebase, SEO técnico y contacto profesional.',
    siteName: 'Daniel Cabrera Portfolio',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Daniel Cabrera Portfolio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daniel Cabrera | Portfolio iOS',
    description: 'Portfolio interactivo de Daniel Cabrera con experiencia iOS: proyectos frontend, apps reales, integración Firebase, SEO técnico y contacto profesional.',
    images: ['/opengraph-image.png'],
  },
  icons: {
    icon: [{ url: '/favicon.ico' }],
    apple: [{ url: '/favicon.ico' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Daniel Cabrera',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b0f1a',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Daniel Cabrera',
    jobTitle: 'Frontend Developer',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com',
    sameAs: [
      'https://github.com/danikeinox',
      'https://linkedin.com/in/dcabreraa/',
    ],
  };

  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <SystemStateProvider>
          <ThemeProvider>
            <I18nProvider>
              <WallpaperProvider>
                <NotificationsProvider>
                  <GoogleCalendarProvider>
                    <HomeScreenProvider>
                      <FirebaseClientProvider>
                        {children}
                      </FirebaseClientProvider>
                    </HomeScreenProvider>
                    <Toaster />
                  </GoogleCalendarProvider>
                </NotificationsProvider>
              </WallpaperProvider>
            </I18nProvider>
          </ThemeProvider>
        </SystemStateProvider>
      </body>
    </html>
  );
}
