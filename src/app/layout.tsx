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
import StartupExperience from '@/components/onboarding/StartupExperience';
import SeoProfileSummary from '@/components/seo/SeoProfileSummary';
import { headers } from 'next/headers';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import { getRootMetadata } from '@/lib/seo/routes';
import { buildJsonLdGraph } from '@/lib/seo/json-ld';

export const metadata: Metadata = getRootMetadata();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b0f1a',
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') || '';
  const jsonLd = buildJsonLdGraph();

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
      </head>
      <body>
        <GoogleAnalytics nonce={nonce} />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SeoProfileSummary />
        <SystemStateProvider>
          <ThemeProvider>
            <I18nProvider>
              <WallpaperProvider>
                <NotificationsProvider>
                  <GoogleCalendarProvider>
                    <HomeScreenProvider>
                      <FirebaseClientProvider>
                        <StartupExperience>{children}</StartupExperience>
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
