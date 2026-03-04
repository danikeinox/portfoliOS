'use client';
import { useI18n } from '@/hooks/use-i18n';
import { useHomeScreen, type WidgetSize } from '@/hooks/use-home-screen';
import { Button } from '@/components/ui/button';
import { WIDGETS, type WidgetConfig } from '@/lib/widgets';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';


interface EditWidgetViewProps {
    widgetId: string;
    onClose: () => void;
}

const EditWidgetView = ({ widgetId, onClose }: EditWidgetViewProps) => {
    const { t } = useI18n();
    const { findItem, updateWidget } = useHomeScreen();
    const { toast } = useToast();
    const currentItem = findItem(widgetId);

    const [selectedType, setSelectedType] = useState(currentItem?.widgetType || '');
    
    const widgetInfo = WIDGETS[selectedType as keyof typeof WIDGETS];
    const SIZES: WidgetSize[] = widgetInfo ? widgetInfo.supportedSizes : [];
    
    const [selectedSize, setSelectedSize] = useState(currentItem && SIZES.includes(currentItem.size!) ? currentItem.size! : SIZES[0]);
    
    const [sizeCarouselApi, setSizeCarouselApi] = useState<CarouselApi>();
    const [currentSizeIndex, setCurrentSizeIndex] = useState(0);

    const [{ y }, api] = useSpring(() => ({ y: window.innerHeight }));
    const open = useCallback(() => api.start({ y: 0, immediate: false, config: { tension: 320, friction: 30 } }), [api]);
    const close = useCallback((velocity = 0) => api.start({ y: window.innerHeight, immediate: false, config: { tension: 320, friction: 30, velocity }, onRest: onClose }), [api, onClose]);
    
    useEffect(() => {
        open();
    }, [open]);
    
    const bind = useDrag(({ last, velocity: [, vy], movement: [, my], cancel, event }) => {
        const target = event.target as HTMLElement;
        const isScrolling = target.closest('[data-radix-scroll-area-viewport]');
        if (isScrolling && isScrolling.scrollTop > 0) return;
        
        if (my > window.innerHeight * 0.3 || (vy > 0.5 && my > 0)) {
            cancel();
            close(vy);
        } else if (last) {
            api.start({ y: 0, config: { tension: 400, friction: 35 } });
        } else {
            api.start({ y: my, immediate: true });
        }
    }, { from: () => [0, y.get()], filterTaps: true, bounds: { top: 0 }, rubberband: true });

    const handleTypeChange = (newType: string) => {
        const newWidgetInfo = WIDGETS[newType as keyof typeof WIDGETS];
        if (!newWidgetInfo) return;

        const newSize = newWidgetInfo.supportedSizes.includes(selectedSize)
            ? selectedSize
            : newWidgetInfo.supportedSizes[0];
            
        const success = updateWidget(widgetId, { type: newType, size: newSize });
        if (success) {
            setSelectedType(newType);
            setSelectedSize(newSize);
        } else {
             toast({
                variant: 'destructive',
                title: t('addWidget.noSpace.title'),
                description: t('addWidget.noSpace.description')
            });
        }
    };

    const handleSizeChange = useCallback(() => {
        if (!sizeCarouselApi) return;
        const newIndex = sizeCarouselApi.selectedScrollSnap();
        if (newIndex === currentSizeIndex) return;

        const newSize = SIZES[newIndex];
        const success = updateWidget(widgetId, { size: newSize });
        
        if (success) {
            setSelectedSize(newSize);
            setCurrentSizeIndex(newIndex);
        } else {
            toast({
                variant: 'destructive',
                title: t('addWidget.noSpace.title'),
                description: t('addWidget.noSpace.description')
            });
            sizeCarouselApi.scrollTo(currentSizeIndex, true);
        }
    }, [sizeCarouselApi, currentSizeIndex, SIZES, widgetId, updateWidget, t, toast]);

    useEffect(() => {
        if (sizeCarouselApi) {
            sizeCarouselApi.on('select', handleSizeChange);
            const initialIndex = SIZES.indexOf(selectedSize);
            if (initialIndex !== -1) {
                sizeCarouselApi.scrollTo(initialIndex, true);
                setCurrentSizeIndex(initialIndex);
            }
            return () => { sizeCarouselApi.off('select', handleSizeChange); };
        }
    }, [sizeCarouselApi, handleSizeChange, SIZES, selectedSize]);

    if (!currentItem || currentItem.type !== 'widget' || !widgetInfo) {
        return null;
    }

    const WidgetComponent = widgetInfo.component;

    const renderWidgetPreviewSize = (size: WidgetSize) => {
        const sizeClasses: Record<WidgetSize, string> = {
            '2x2': 'w-44 h-44',
            '2x4': 'w-96 h-44',
            '4x4': 'w-96 h-96',
        };
        return (
            <div className={cn("rounded-2xl overflow-hidden bg-neutral-800", sizeClasses[size])}>
                <div className="w-full h-full pointer-events-none scale-[0.9] origin-center">
                    <WidgetComponent size={size} />
                </div>
            </div>
        );
    };

    return (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-0 touch-none" 
            onClick={() => close()}
        >
            <animated.div 
                style={{ y }}
                className="bg-[#1D1D1F] w-full max-w-xl rounded-t-3xl flex flex-col relative max-h-[90vh] shadow-2xl"
                onClick={e => e.stopPropagation()}
                {...bind()}
            >
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-neutral-600 rounded-full" />
                
                <div className="flex-shrink-0 px-4 pt-4 pb-2 flex justify-between items-center text-white">
                    <h2 className="text-xl font-bold">{t('editWidget.title')}</h2>
                    <Button onClick={() => close()} className="bg-neutral-700 hover:bg-neutral-600 rounded-full h-auto px-5 py-1.5 font-semibold text-white">{t('done')}</Button>
                </div>
                
                <ScrollArea className="flex-1 min-h-0 touch-auto">
                    <div className="p-4 space-y-8">
                        <div>
                            <h3 className="font-semibold text-neutral-400 mb-3 px-2">{t('editWidget.type')}</h3>
                            <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
                                <CarouselContent className="-ml-2">
                                    {Object.values(WIDGETS).map((widget: WidgetConfig) => {
                                        const isSelected = selectedType === widget.type;
                                        return (
                                            <CarouselItem key={widget.type} className="pl-4 basis-1/3 sm:basis-1/4">
                                                <div 
                                                    onClick={() => handleTypeChange(widget.type)} 
                                                    className="cursor-pointer space-y-2"
                                                >
                                                    <div className={cn(
                                                        "w-full aspect-square rounded-2xl overflow-hidden ring-2 ring-inset transition-colors", 
                                                        isSelected ? "ring-blue-500" : "ring-transparent hover:ring-white/20"
                                                    )}>
                                                    <div className="pointer-events-none scale-[0.9] origin-center bg-neutral-800 h-full w-full rounded-xl">
                                                            <widget.component size={widget.supportedSizes[0]} />
                                                    </div>
                                                    </div>
                                                    <p className="text-xs text-center text-neutral-300">{t(widget.nameKey)}</p>
                                                </div>
                                            </CarouselItem>
                                        );
                                    })}
                                </CarouselContent>
                            </Carousel>
                        </div>

                        <div>
                            <h3 className="font-semibold text-neutral-400 mb-3 px-2">{t('editWidget.size')}</h3>
                            <Carousel setApi={setSizeCarouselApi} opts={{ align: 'center' }} className="w-full">
                                <CarouselContent>
                                    {SIZES.map((size) => (
                                        <CarouselItem key={size} className="flex justify-center">
                                            {renderWidgetPreviewSize(size)}
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                            </Carousel>
                            {SIZES.length > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-4">
                                    {SIZES.map((size, index) => (
                                        <button
                                            key={size}
                                            onClick={() => sizeCarouselApi?.scrollTo(index)}
                                            className={cn(
                                                "w-2 h-2 rounded-full transition-colors",
                                                currentSizeIndex === index ? 'bg-white' : 'bg-neutral-600'
                                            )}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
                <div className='h-[env(safe-area-inset-bottom)]' />
            </animated.div>
        </div>
    );
};

export default EditWidgetView;
