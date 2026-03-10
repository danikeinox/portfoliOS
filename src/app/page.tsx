'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import HomeScreen from "@/components/ios/HomeScreen";
import StatusBar from "@/components/ios/StatusBar";
import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';

// Lazy-load components only needed on user interaction
const ControlCenter = dynamic(() => import('@/components/ios/ControlCenter'), { ssr: false });
const NotificationCenter = dynamic(() => import('@/components/ios/NotificationCenter'), { ssr: false });
const EditMenu = dynamic(() => import('@/components/ios/EditMenu'), { ssr: false });
const AddWidgetView = dynamic(() => import('@/components/ios/AddWidgetView'), { ssr: false });
const CustomizeView = dynamic(() => import('@/components/ios/CustomizeView'), { ssr: false });

export default function Home() {
    const [isControlCenterVisible, setControlCenterVisible] = useState(false);
    const [isNotificationCenterVisible, setNotificationCenterVisible] = useState(false);
    const [isJiggleMode, setJiggleMode] = useState(false);
    const [isAppLibraryVisible, setIsAppLibraryVisible] = useState(false);

    const [isEditingPages, setEditingPages] = useState(false);
    const [isEditMenuOpen, setEditMenuOpen] = useState(false);
    const [isAddingWidget, setAddingWidget] = useState(false);
    const [isCustomizing, setCustomizing] = useState(false);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    const { t } = useI18n();

    const toggleJiggleMode = (state?: boolean) => {
        const newState = state ?? !isJiggleMode;
        setJiggleMode(newState);
        if (!newState) {
            setEditMenuOpen(false);
            setEditingPages(false);
            setAddingWidget(false);
            setCustomizing(false);
        }
    };

    const closeAllOverlays = () => {
        setControlCenterVisible(false);
        setNotificationCenterVisible(false);
    };

    const handleHomeScreenClick = () => {
        // This function is now empty to prevent mobile touch conflicts.
        // The user must use the "OK" button to exit jiggle mode, which mimics native iOS behavior.
    };

    return (
        <div className="h-[100dvh] w-screen flex flex-col font-sans relative">
            <h1 className="sr-only">Daniel Cabrera - Portfolio iOS</h1>

            <div className={cn(
                "w-full shrink-0 z-30 transition-opacity duration-200",
                isJiggleMode && !isAppLibraryVisible && !isEditingPages ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
                <StatusBar
                    onToggleControlCenter={() => {
                        if (isNotificationCenterVisible) setNotificationCenterVisible(false);
                        setControlCenterVisible(prev => !prev)
                    }}
                    onToggleNotificationCenter={() => {
                        if (isControlCenterVisible) setControlCenterVisible(false);
                        setNotificationCenterVisible(prev => !prev)
                    }}
                />
            </div>

            {isJiggleMode && !isAppLibraryVisible && !isEditingPages && !isAddingWidget && !isCustomizing && (
                <div className="absolute top-[calc(env(safe-area-inset-top,0px)+0.25rem)] left-4 right-4 flex justify-between items-center z-50 pointer-events-none animate-in fade-in duration-200">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditMenuOpen(true);
                        }}
                        className="bg-white/30 text-white font-semibold text-sm px-4 py-1.5 rounded-full backdrop-blur-md shadow-lg pointer-events-auto"
                    >
                        {t('home.edit')}
                    </button>
                    <button
                        onClick={() => toggleJiggleMode(false)}
                        className="bg-white/30 hover:bg-white/40 text-white text-sm font-bold px-4 py-1.5 rounded-full backdrop-blur-md shadow-lg transition-colors pointer-events-auto"
                    >
                        {t('home.ok')}
                    </button>
                </div>
            )}

            {isEditMenuOpen && (
                <EditMenu
                    onClose={() => setEditMenuOpen(false)}
                    onEditPages={() => setEditingPages(true)}
                    onAddWidget={() => setAddingWidget(true)}
                    onCustomize={() => setCustomizing(true)}
                />
            )}

            <div className="flex-1 min-h-0 relative">
                <HomeScreen
                    isJiggleMode={isJiggleMode}
                    toggleJiggleMode={toggleJiggleMode}
                    onContainerClick={handleHomeScreenClick}
                    onAppLibraryVisibilityChange={setIsAppLibraryVisible}
                    isEditingPages={isEditingPages}
                    setEditingPages={setEditingPages}
                    onPageIndexChange={setCurrentPageIndex}
                />
            </div>

            {isAddingWidget && <AddWidgetView onClose={() => setAddingWidget(false)} pageIndex={currentPageIndex} />}
            {isCustomizing && <CustomizeView onClose={() => setCustomizing(false)} />}

            <ControlCenter isVisible={isControlCenterVisible} onClose={closeAllOverlays} />
            <NotificationCenter isVisible={isNotificationCenterVisible} onClose={closeAllOverlays} />
        </div>
    );
}
