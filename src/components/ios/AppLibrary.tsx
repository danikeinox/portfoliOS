'use client';
import type { App, AppCategory } from '@/lib/apps';
import { useEffect, useMemo, useState } from 'react';
import AppLibraryFolder from './AppLibraryFolder';
import { useI18n } from '@/hooks/use-i18n';
import AppIcon from './AppIcon';
import { getAvailableApps, findApp } from '@/lib/apps';
import { X, Search } from 'lucide-react';
import { useHomeScreen } from '@/hooks/use-home-screen';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { INSTALLED_APPS_UPDATED_EVENT } from '@/lib/installed-apps';

const AppLibrary = () => {
    const { t } = useI18n();
    const [openCategory, setOpenCategory] = useState<AppCategory | 'search' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [appsRefreshToken, setAppsRefreshToken] = useState(0);
    const { addApp } = useHomeScreen();

    useEffect(() => {
        const handleInstalledAppsUpdated = () => setAppsRefreshToken((current) => current + 1);
        window.addEventListener(INSTALLED_APPS_UPDATED_EVENT, handleInstalledAppsUpdated);
        window.addEventListener('storage', handleInstalledAppsUpdated);

        return () => {
            window.removeEventListener(INSTALLED_APPS_UPDATED_EVENT, handleInstalledAppsUpdated);
            window.removeEventListener('storage', handleInstalledAppsUpdated);
        };
    }, []);

    const { suggestions, recentlyAdded, categorizedApps, allApps } = useMemo(() => {
        const uniqueApps = Array.from(new Map(getAvailableApps().map(app => [app.id, app])).values());

        const categories: Record<string, App[]> = {};
        const allAppsForProcessing = uniqueApps.map(app => ({ ...app, category: app.category || 'Utilities' }));

        allAppsForProcessing.forEach(app => {
            if (!categories[app.category!]) {
                categories[app.category!] = [];
            }
            categories[app.category!].push(app);
        });

        const suggestions = allAppsForProcessing.slice(0, 4);
        const recentlyAdded = allAppsForProcessing.slice(4, 8);

        return { suggestions, recentlyAdded, categorizedApps: categories, allApps: allAppsForProcessing };
    }, [appsRefreshToken]);

    const searchResults = useMemo(() => {
        if (!searchQuery) return [];
        const lowerCaseQuery = searchQuery.toLowerCase();
        return allApps.filter(app => t(app.title).toLowerCase().includes(lowerCaseQuery));
    }, [searchQuery, allApps, t]);

    const categoryOrder: AppCategory[] = ['Productivity', 'Social', 'Entertainment', 'Creativity', 'Information & Reading', 'Development', 'Utilities', 'Business'];
    const sortedCategories = Object.entries(categorizedApps).sort(([a], [b]) => {
        const indexA = categoryOrder.indexOf(a as AppCategory);
        const indexB = categoryOrder.indexOf(b as AppCategory);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    const handleFolderClick = (category: AppCategory | 'search') => {
        setOpenCategory(category);
    };

    const handleAddToHomeScreen = (appId: string) => {
        addApp(appId);
        const appInfo = findApp(appId);
        if (appInfo) {
            toast({ title: t('appAdded.title', { appTitle: t(appInfo.title) }) });
        }
        setOpenCategory(null);
    };

    const currentApps = openCategory === 'search'
        ? searchResults
        : (openCategory ? categorizedApps[openCategory as AppCategory] : []);

    const renderContent = () => {
        if (searchQuery) {
            if (searchResults.length === 0) {
                return <div className="col-span-2 text-center text-neutral-400 mt-8">{t('appLibrary.noResults')}</div>;
            }
            if (searchResults.length <= 4) {
                return <AppLibraryFolder title={t('appLibrary.searchResults')} apps={searchResults} isActionableGrid={true} onAppClick={handleAddToHomeScreen} />;
            }
            return <AppLibraryFolder title={t('appLibrary.searchResults')} apps={searchResults} isActionableGrid={false} onFolderClick={() => handleFolderClick('search')} />;
        }

        return (
            <>
                <AppLibraryFolder title={t('app.suggestions')} apps={suggestions} isActionableGrid={true} onAppClick={handleAddToHomeScreen} />
                <AppLibraryFolder title={t('app.recentlyAdded')} apps={recentlyAdded} isActionableGrid={true} onAppClick={handleAddToHomeScreen} />
                {sortedCategories.map(([category, apps]) => (
                    <AppLibraryFolder
                        key={category}
                        title={t(category as any)}
                        apps={apps}
                        isActionableGrid={false}
                        onFolderClick={() => handleFolderClick(category as AppCategory)}
                    />
                ))}
            </>
        );
    }

    return (
        <div className="h-full w-full flex flex-col text-white relative">
            <div className="shrink-0 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 backdrop-blur-sm z-20 mx-auto">
                <div className="px-4">
                    <div className="relative w-full max-w-sm mx-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={14} />
                        <input
                            type="text"
                            placeholder={t('appLibrary.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/30 rounded-lg pl-8 pr-3 py-2 text-white placeholder:text-white/60 text-sm border-none outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            <div
                className="flex-1 overflow-y-auto overscroll-y-contain min-h-0 pointer-events-auto"
            >
                <div className={cn(
                    "mx-auto w-full max-w-xl p-4 pb-[calc(env(safe-area-inset-bottom)+8rem)]",
                    searchQuery ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                )}>
                    {renderContent()}
                </div>
            </div>

            {openCategory && (
                <div
                    className="absolute inset-0 z-[100] bg-black/40 backdrop-blur flex justify-center items-center pointer-events-auto"
                    onClick={() => setOpenCategory(null)}
                >
                    <div
                        className="bg-neutral-800/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] text-white w-[340px] max-w-[90vw] p-3 flex flex-col shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute right-4 top-4 rounded-full bg-black/20 p-1.5 opacity-70 hover:opacity-100 z-10"
                            onClick={() => setOpenCategory(null)}
                        >
                            <X className="h-4 w-4" />
                        </button>
                        <div className="text-center pt-2 pb-2">
                            <h2 className="text-xl font-bold">{openCategory === 'search' ? t('appLibrary.searchResults') : t(openCategory as any)}</h2>
                        </div>
                        <div className="grid grid-cols-4 gap-y-6 gap-x-2 py-4 px-2 max-h-[50vh] overflow-y-auto">
                            {currentApps.map(app => (
                                <AppIcon
                                    key={app.id}
                                    app={app}
                                    isJiggleMode={false}
                                    action="addToHomeScreen"
                                    onAddToHomeScreen={handleAddToHomeScreen}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppLibrary;
