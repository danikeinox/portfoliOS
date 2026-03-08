'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import AppFrame from '@/components/apps/AppFrame';
import AppCrashBoundary from '@/components/apps/AppCrashBoundary';
import { getAvailableApps } from '@/lib/apps';
import { useI18n } from '@/hooks/use-i18n';
import UnderDevelopment from '@/components/apps/UnderDevelopment';
import GenericWebAppContainer from '@/components/apps/GenericWebAppContainer';
import GenericWebAppErrorBoundary from '@/components/apps/GenericWebAppErrorBoundary';
import {
    fromInstalledSlug,
    getInstalledAppBySlug,
    INSTALLED_APPS_UPDATED_EVENT,
    queueInstalledAppUpdate,
} from '@/lib/installed-apps';
import type { AppStoreApiResponse, AppStoreApp } from '@/lib/appstore/contracts';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

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
const WeatherApp = dynamic(() => import('@/components/apps-developed/WeatherApp'), { loading: LoadingDark, ssr: false });

// 1. NUEVA FUNCIÓN: Decide si la app necesita un tema forzado
const getForceTheme = (slug: string): 'light' | 'dark' | undefined => {
    switch (slug) {
        case 'spotify': break;
        case 'camera': break;
        case 'podcasts': return 'dark'; break;
        case 'tv': break;
        case 'facetime':
            return 'dark'; break;
        case 'safari': break;
        case 'about': break;
        case 'calendar': break;
        case 'appstore': break;
        case 'news': break;
        case 'phone': break;
        case 'maps':
            return 'light'; break;
            break; break;
        default:
            return undefined; // Undefined significa: "respeta el tema general del SO"
    }
};

const getHomeBarBackgroundClass = (slug: string): string | undefined => {
    switch (slug) {
        case 'appstore':
            return 'bg-white/95 dark:bg-[#1C1C1E]/80';
        case 'spotify':
            break;
        case 'camera':
            break;
        case 'facetime':
            break;
        case 'tv':
            break;
        case 'podcasts':
            return 'bg-black';
            break;
        case 'about':
            return 'bg-neutral-200/60 dark:bg-[#3A3A3C]';
            break;
        case 'safari':
            return 'bg-neutral-200/60 dark:bg-[#3A3A3C]';
            break;
        case 'calendar':
            return 'bg-[#F2F2F7] dark:bg-[#1C1C1E]';
            break;
        case 'maps':
            break;
        case 'phone':
            break;
        case 'news':
            break;
        case 'notes':
            return 'bg-[#F2F2F7] dark:bg-black';
            break;
        case 'clock':
            return 'bg-white dark:bg-[#1C1C1E]';
            break;
        case 'blog':
            break;
        case 'photos':
            return 'bg-neutral-100/80 dark:bg-neutral-900/80';
            break;
        case 'services':
            break;
        case 'messages':
            break;
        case 'contact':
            break;
        case 'testimonials':
            return 'bg-[#F2F2F7] dark:bg-black';
            break;
        default:
            return undefined;
    }
};

const getFrameBgClass = (slug: string): string | undefined => {
    if (slug === 'safari' || slug === 'about') return 'bg-neutral-200/60 dark:bg-[#3A3A3C]';
    return undefined;
};

function compareSemver(left: string, right: string): number {
    const leftParts = left.split('.').map((part) => Number(part));
    const rightParts = right.split('.').map((part) => Number(part));
    const max = Math.max(leftParts.length, rightParts.length);

    for (let index = 0; index < max; index += 1) {
        const leftValue = Number.isFinite(leftParts[index]) ? leftParts[index] : 0;
        const rightValue = Number.isFinite(rightParts[index]) ? rightParts[index] : 0;
        if (leftValue > rightValue) {
            return 1;
        }
        if (leftValue < rightValue) {
            return -1;
        }
    }

    return 0;
}

type AppDetailApi = AppStoreApiResponse<AppStoreApp>;

const AppViewer = ({ slug }: { slug: string }) => {
    const { locale, t } = useI18n();
    const installedAppId = useMemo(() => fromInstalledSlug(slug), [slug]);
    const [installedApp, setInstalledApp] = useState(() => getInstalledAppBySlug(slug));
    const [updateCandidate, setUpdateCandidate] = useState<AppStoreApp | null>(null);
    const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);

    useEffect(() => {
        if (!installedAppId) {
            setInstalledApp(null);
            return;
        }

        const syncInstalledApp = () => {
            setInstalledApp(getInstalledAppBySlug(slug));
        };

        syncInstalledApp();
        window.addEventListener(INSTALLED_APPS_UPDATED_EVENT, syncInstalledApp);
        return () => {
            window.removeEventListener(INSTALLED_APPS_UPDATED_EVENT, syncInstalledApp);
        };
    }, [slug, installedAppId]);

    useEffect(() => {
        if (!installedAppId || !installedApp) {
            setUpdateCandidate(null);
            return;
        }

        let cancelled = false;

        const checkForUpdates = async () => {
            try {
                const response = await fetch(`/api/appstore/apps/${installedAppId}?lang=${locale}`);
                const json = (await response.json()) as AppDetailApi;
                if (!json.success || cancelled) {
                    return;
                }

                const remoteApp = json.data;
                const installedVersion = installedApp.version?.trim() || '0.0.0';
                const hasNewVersion = compareSemver(remoteApp.version, installedVersion) > 0;
                const hasMetadataChanges =
                    remoteApp.title !== installedApp.name ||
                    remoteApp.externalUrl !== installedApp.externalUrl ||
                    (remoteApp.iconUrl && remoteApp.iconUrl !== installedApp.iconUrl);

                if (hasNewVersion || hasMetadataChanges) {
                    setUpdateCandidate(remoteApp);
                    return;
                }

                setUpdateCandidate(null);
            } catch {
                if (!cancelled) {
                    setUpdateCandidate(null);
                }
            }
        };

        void checkForUpdates();

        return () => {
            cancelled = true;
        };
    }, [installedAppId, installedApp, locale]);

    const applyInstalledUpdate = () => {
        if (!installedAppId || !updateCandidate || !installedApp) {
            return;
        }

        setIsApplyingUpdate(true);
        queueInstalledAppUpdate({
            id: installedAppId,
            name: updateCandidate.title,
            iconUrl: updateCandidate.iconUrl?.trim() || installedApp.iconUrl,
            externalUrl: updateCandidate.externalUrl,
            version: updateCandidate.version,
        });

        // Return to home; HomeScreen applies the queued update in a clean state.
        window.location.assign('/');
    };

    const allApps = getAvailableApps();
    const app = allApps.find(a => a.id === slug);
    const appTitle = installedApp
        ? installedApp.name
        : app
            ? (app.title.startsWith('app.') ? t(app.title) : app.title)
            : 'App';

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
            case 'weather': return <WeatherApp />;
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
                if (installedApp) {
                    return (
                        <GenericWebAppErrorBoundary>
                            <GenericWebAppContainer appName={installedApp.name} externalUrl={installedApp.externalUrl} />
                        </GenericWebAppErrorBoundary>
                    );
                }

                return <UnderDevelopment />;
        }
    };

    // 2. Calculamos el tema y se lo pasamos al AppFrame
    const forceTheme = getForceTheme(slug);
    const homeBarBackgroundClass = getHomeBarBackgroundClass(slug);
    const frameBgClass = getFrameBgClass(slug);

    return (
        <>
            <Dialog open={updateCandidate !== null} onOpenChange={(open) => !open && setUpdateCandidate(null)}>
                <DialogContent className="sm:max-w-md rounded-3xl border border-neutral-300/70 dark:border-[#38383A]/80 p-0 overflow-hidden bg-white dark:bg-[#1C1C1E] text-black dark:text-white">
                    <DialogHeader className="px-6 pt-6 pb-2 text-left">
                        <DialogTitle className="text-xl font-semibold">{t('appstore.updateAvailableTitle')}</DialogTitle>
                        <DialogDescription className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">
                            {updateCandidate
                                ? t('appstore.updateAvailableDescriptionWithVersion', {
                                    title: updateCandidate.title,
                                    version: updateCandidate.version,
                                })
                                : t('appstore.updateAvailableDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-6 pb-6 space-y-2">
                        <Button
                            type="button"
                            className="h-11 w-full rounded-full bg-[#0A84FF] text-white"
                            onClick={applyInstalledUpdate}
                            disabled={isApplyingUpdate}
                        >
                            {isApplyingUpdate ? t('appstore.updating') : t('appstore.updateNow')}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            className="h-11 w-full rounded-full"
                            onClick={() => setUpdateCandidate(null)}
                            disabled={isApplyingUpdate}
                        >
                            {t('appstore.updateLater')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <AppFrame appName={appTitle} forceTheme={forceTheme} homeBarBackgroundClass={homeBarBackgroundClass} frameBgClass={frameBgClass}>
                <AppCrashBoundary appName={appTitle}>{renderApp()}</AppCrashBoundary>
            </AppFrame>
        </>
    );
}

export default AppViewer;
