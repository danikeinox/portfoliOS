'use client';
import { useI18n } from '@/hooks/use-i18n';
import { Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WIDGETS } from '@/lib/widgets';
import { useHomeScreen, type WidgetSize } from '@/hooks/use-home-screen';
import { toast } from '@/hooks/use-toast';
import { useRef, useEffect } from 'react';
import { useDrag } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';
import { cn } from '@/lib/utils';

// This component will render a single widget inside the gallery
const WidgetGalleryItem = ({ widgetType, onClick }: { widgetType: string; onClick: () => void; }) => {
    const { t } = useI18n();
    const widgetInfo = WIDGETS[widgetType];
    if (!widgetInfo) return null;

    const size = widgetInfo.defaultSize; // Use default size for the preview
    const sizeClasses: Record<WidgetSize, string> = {
        '2x2': 'aspect-square',
        '2x4': 'aspect-[2/1]',
        '4x4': 'aspect-square',
    };

    return (
        <div className="space-y-2 cursor-pointer group" onClick={onClick}>
             <div className={cn("w-full rounded-2xl overflow-hidden bg-neutral-800 transition-colors group-hover:bg-neutral-700", sizeClasses[size])}>
                <div className="w-full h-full pointer-events-none scale-[0.9] origin-center">
                    <widgetInfo.component />
                </div>
            </div>
            <p className="font-semibold text-base">{t(widgetInfo.nameKey)}</p>
            <p className="text-sm text-neutral-400 -mt-1">{t(widgetInfo.nameKey)}</p>
        </div>
    );
};


interface AddWidgetViewProps {
    onClose: () => void;
    pageIndex: number;
}

const AddWidgetView = ({ onClose, pageIndex }: AddWidgetViewProps) => {
    const { t } = useI18n();
    const { addWidget } = useHomeScreen();

    const [{ y }, api] = useSpring(() => ({ y: window.innerHeight }));

    const open = () => {
        api.start({ y: 0, immediate: false, config: { tension: 320, friction: 30 } });
    };

    const close = (velocity = 0) => {
        api.start({
            y: window.innerHeight,
            immediate: false,
            config: { tension: 320, friction: 30, velocity },
            onRest: onClose,
        });
    };

    // Open on mount
    useEffect(() => {
        open();
    }, []);
    
    useDrag(
        ({ last, velocity: [, vy], movement: [, my], cancel, event }) => {
             // Let scroll events pass through
            if (event.target && (event.target as HTMLElement).closest('[data-radix-scroll-area-viewport]')) {
                const scrollable = (event.target as HTMLElement).closest('[data-radix-scroll-area-viewport]') as HTMLElement;
                if (scrollable.scrollTop > 0 && my < 0) return;
            }

            if (my > window.innerHeight * 0.4 || vy > 0.5) {
                cancel();
                close(vy);
            } else if (last) {
                api.start({ y: 0, config: { tension: 400, friction: 35 } });
            } else {
                api.start({ y: my, immediate: true });
            }
        },
        { from: () => [0, y.get()], filterTaps: true, bounds: { top: 0 }, rubberband: true }
    );

    const handleAddWidget = (widgetType: string) => {
        const widgetInfo = WIDGETS[widgetType];
        if (!widgetInfo) return;

        addWidget(widgetType, pageIndex);
        
        toast({
            title: t('appAdded.title', { appTitle: t(widgetInfo.nameKey) })
        });
        close();
    };
    
    return (
        <animated.div 
            style={{ y, top: 'calc(env(safe-area-inset-top) + 10px)' }}
            className="absolute inset-x-0 bottom-0 bg-neutral-900/80 backdrop-blur-2xl z-50 flex flex-col text-white rounded-t-3xl"
        >
            <div className="w-full flex-shrink-0 flex justify-center py-3 cursor-grab" {...useDrag(({ movement: [, my] }) => {
                if (my > 100) close();
            }).bind()}>
                <div className="w-10 h-1.5 bg-neutral-600 rounded-full" />
            </div>

            <div className="px-4 pb-4 flex-shrink-0">
                 <h1 className="text-4xl font-bold mb-4">{t('editMenu.addWidget')}</h1>
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                    <input
                        type="text"
                        placeholder={t('widget.searchPlaceholder')}
                        className="w-full bg-neutral-800 rounded-xl pl-11 pr-4 py-3 text-base text-white placeholder:text-neutral-400 border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 min-h-0 touch-auto">
                <div className="p-4 pt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                   {Object.keys(WIDGETS).map(widgetType => (
                        <WidgetGalleryItem 
                            key={widgetType} 
                            widgetType={widgetType} 
                            onClick={() => handleAddWidget(widgetType)}
                        />
                   ))}
                </div>
            </ScrollArea>
        </animated.div>
    );
};

export default AddWidgetView;
