'use client';

import dynamic from 'next/dynamic';
import AppFrame from '@/components/apps/AppFrame';
import AppCrashBoundary from '@/components/apps/AppCrashBoundary';
import { HOME_SCREEN_APPS, DOCK_APPS } from '@/lib/apps';
import { useI18n } from '@/hooks/use-i18n';
import UnderDevelopment from '@/components/apps/UnderDevelopment';

const LoadingDark = () => <div className="h-full w-full bg-black" />;
const LoadingLight = () => <div className="h-full w-full bg-white" />;
const LoadingNeutral = () => <div className="h-full w-full bg-white dark:bg-black" />;

const PortfolioApp = dynamic(() => import('@/components/apps-developed/PortfolioApp'), { loading: LoadingNeutral, ssr: false });
const AboutApp = dynamic(() => import('@/components/apps-developed/AboutApp'), { loading: LoadingLight, ssr: false });
const SettingsApp = dynamic(() => import('@/components/apps-developed/SettingsApp'), { loading: LoadingNeutral, ssr: false });
const CameraApp = dynamic(() => import('@/components/apps-developed/CameraApp'), { loading: LoadingDark, ssr: false });
const PhotosApp = dynamic(() => import('@/components/apps-developed/PhotosApp'), { loading: LoadingNeutral, ssr: false });
const NotesApp = dynamic(() => import('@/components/apps-developed/NotesApp'), { loading: LoadingNeutral, ssr: false });
const BlogApp = dynamic(() => import('@/components/apps-developed/BlogApp'), { loading: LoadingNeutral, ssr: false });
const ContactApp = dynamic(() => import('@/components/apps-developed/ContactApp'), { loading: LoadingNeutral, ssr: false });
const TestimonialsApp = dynamic(() => import('@/components/apps-developed/TestimonialsApp'), { loading: LoadingNeutral, ssr: false });
const SpotifyApp = dynamic(() => import('@/components/apps-developed/SpotifyApp'), { loading: LoadingDark, ssr: false });
const SafariApp = dynamic(() => import('@/components/apps-developed/SafariApp'), { loading: LoadingLight, ssr: false });
const MessagesApp = dynamic(() => import('@/components/apps-developed/MessagesApp'), { loading: LoadingNeutral, ssr: false });
const YoutubeApp = dynamic(() => import('@/components/apps-developed/YoutubeApp'), { loading: LoadingNeutral, ssr: false });
const CalendarApp = dynamic(() => import('@/components/apps-developed/CalendarApp'), { loading: LoadingLight, ssr: false });
const ClockApp = dynamic(() => import('@/components/apps-developed/ClockApp'), { loading: LoadingNeutral, ssr: false });
const MapsApp = dynamic(() => import('@/components/apps-developed/MapsApp'), { loading: LoadingLight, ssr: false });
const FaceTimeApp = dynamic(() => import('@/components/apps-developed/FaceTimeApp'), { loading: LoadingDark, ssr: false });
const PhoneApp = dynamic(() => import('@/components/apps-developed/PhoneApp'), { loading: LoadingLight, ssr: false });
const ServicesApp = dynamic(() => import('@/components/apps-developed/ServicesApp'), { loading: LoadingNeutral, ssr: false });
const TvApp = dynamic(() => import('@/components/apps-developed/TvApp'), { loading: LoadingDark, ssr: false });
const PodcastsApp = dynamic(() => import('@/components/apps-developed/PodcastsApp'), { loading: LoadingDark, ssr: false });
const AppStoreApp = dynamic(() => import('@/components/apps-developed/AppStoreApp'), { loading: LoadingLight, ssr: false });
const NewsApp = dynamic(() => import('@/components/apps-developed/NewsApp'), { loading: LoadingLight, ssr: false });
const WeatherApp = dynamic(() => import('@/components/apps/Weather'), { loading: LoadingDark, ssr: false });

// 1. NUEVA FUNCIÓN: Decide si la app necesita un tema forzado
const getForceTheme = (slug: string): 'light' | 'dark' | undefined => {
    switch (slug) {
        case 'spotify':
        case 'camera':
        case 'podcasts':
        case 'tv':
        case 'facetime':
            return 'dark';
         case 'safari':
         case 'about':
         case 'calendar':
         case 'appstore':
         case 'news':
         case 'phone':
         case 'maps':
             return 'light';
        default:
            return undefined; // Undefined significa: "respeta el tema general del SO"
    }
};

const getHomeBarBackgroundClass = (slug: string): string | undefined => {
    switch (slug) {
        case 'spotify':
        case 'camera':
        case 'facetime':
        case 'tv':
        case 'podcasts':
            return 'bg-black';
        case 'about':
        case 'safari':
            return 'bg-neutral-200/60 dark:bg-[#3A3A3C]';
        case 'calendar':
        case 'maps':
        case 'phone':
        case 'news':
            return 'bg-white';
        case 'notes':
            return 'bg-[#F2F2F7] dark:bg-black';
        case 'clock':
        case 'blog':
        case 'photos':
        case 'services':
        case 'messages':
        case 'contact':
        case 'testimonials':
            return 'bg-[#F2F2F7] dark:bg-black';
        default:
            return undefined;
    }
};

const getFrameBgClass = (slug: string): string | undefined => {
    if (slug === 'safari' || slug === 'about') return 'bg-neutral-200/60 dark:bg-[#3A3A3C]';
    return undefined;
};

const AppViewer = ({ slug }: { slug: string }) => {
    const { t } = useI18n();
    const allApps = [...HOME_SCREEN_APPS, ...DOCK_APPS];
    const app = allApps.find(a => a.id === slug);
    const appTitle = app ? t(app.title) : 'App';

    const renderApp = () => {
         switch (slug) {
            case 'portfolio': return <PortfolioApp />;
            case 'about': return <AboutApp />;
            case 'settings': return <SettingsApp />;
            case 'camera': return <CameraApp />;
            case 'photos': return <PhotosApp />;
            case 'notes': return <NotesApp />;
            case 'blog': return <BlogApp />;
            case 'contact': return <ContactApp />;
            case 'testimonials': return <TestimonialsApp />;
            case 'spotify': return <SpotifyApp />;
            case 'safari': return <SafariApp />;
            case 'messages': return <MessagesApp />;
            case 'youtube': return <YoutubeApp />;
            case 'calendar': return <CalendarApp />;
            case 'clock': return <ClockApp />;
            case 'weather': return (
                <div className="h-full w-full bg-black text-white flex flex-col pt-10">
                    <WeatherApp />
                </div>
            );
            case 'maps': return <MapsApp />;
            case 'facetime': return <FaceTimeApp />;
            case 'phone': return <PhoneApp />;

            // Mocked/Under Development Apps
            case 'services': return <ServicesApp />;
            case 'tv': return <TvApp />;
            case 'podcasts': return <PodcastsApp />;
            case 'appstore': return <AppStoreApp />;
            case 'news': return <NewsApp />;

            default:
                return <UnderDevelopment />;
        }
    };

    // 2. Calculamos el tema y se lo pasamos al AppFrame
    const forceTheme = getForceTheme(slug);
    const homeBarBackgroundClass = getHomeBarBackgroundClass(slug);
    const frameBgClass = getFrameBgClass(slug);

    return (
        <AppFrame appName={appTitle} forceTheme={forceTheme} homeBarBackgroundClass={homeBarBackgroundClass} frameBgClass={frameBgClass}>
            <AppCrashBoundary appName={appTitle}>{renderApp()}</AppCrashBoundary>
        </AppFrame>
    );
}

export default AppViewer;
