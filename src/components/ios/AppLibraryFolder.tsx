'use client';
import type { App } from '@/lib/apps';
import { systemIconMapping } from './AppIcon';
import { useI18n } from '@/hooks/use-i18n';

interface AppLibraryFolderProps {
    title: string;
    apps: App[];
    isActionableGrid: boolean;
    onFolderClick?: () => void;
    onAppClick?: (appId: string) => void;
}

const AppLibraryFolder = ({ title, apps, isActionableGrid, onFolderClick, onAppClick }: AppLibraryFolderProps) => {
    const { t } = useI18n();

    const handleInteractionStart = (e: React.TouchEvent | React.MouseEvent) => {
        // This stops the event from bubbling to the long-press detector on the homescreen.
        e.stopPropagation();
    };

    const renderIcon = (app: App) => {
        const systemStyle = systemIconMapping[app.id] || {};
        const bgColor = systemStyle.bgColor || app.bgColor || 'transparent';
        const color = systemStyle.color || app.color || 'white';
        const Icon = systemStyle.icon || app.icon;
        const appTitle = t(app.title);

        const iconContent = (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: bgColor }}>
                <Icon className="w-[55%] h-[55%]" style={{ color }} />
            </div>
        );

        if (isActionableGrid) {
            return (
                <button 
                    key={app.id} 
                    onClick={() => onAppClick?.(app.id)}
                    className="relative w-full h-full rounded-md overflow-hidden" 
                    title={appTitle}
                    onMouseDown={handleInteractionStart}
                    onTouchStart={handleInteractionStart}
                >
                    {iconContent}
                </button>
            );
        }
        return (
            <div key={app.id} className="relative w-full h-full rounded-md overflow-hidden">
                {iconContent}
            </div>
        );
    };
    
    const content = (
        <>
            <div className="grid grid-cols-2 grid-rows-2 gap-1.5 flex-grow">
                {apps.slice(0, 4).map(renderIcon)}
            </div>
            <h3 className="text-white text-center text-xs mt-2 truncate font-medium">{title}</h3>
        </>
    );

    if (isActionableGrid) {
        return (
            <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-2.5 flex flex-col aspect-square">
                {content}
            </div>
        );
    }

    return (
        <button 
            onClick={onFolderClick} 
            className="bg-white/10 backdrop-blur-2xl rounded-2xl p-2.5 flex flex-col aspect-square relative cursor-pointer group text-left w-full"
            onMouseDown={handleInteractionStart}
            onTouchStart={handleInteractionStart}
        >
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            {content}
        </button>
    );
}

export default AppLibraryFolder;
