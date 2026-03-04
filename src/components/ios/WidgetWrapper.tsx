'use client';
import { cn } from '@/lib/utils';
import { Minus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useI18n } from '@/hooks/use-i18n';
import { findWidget } from '@/lib/widgets';
import type { WidgetSize } from '@/hooks/use-home-screen';
import React, { forwardRef } from 'react';

interface WidgetWrapperProps {
    widgetId: string;
    itemId: string;
    isJiggleMode: boolean;
    onRemove: () => void;
    onEdit: (itemId: string) => void;
    size?: WidgetSize;
    isDragging?: boolean;
    style?: React.CSSProperties;
}

const WidgetWrapper = forwardRef<HTMLDivElement, WidgetWrapperProps>(({ 
    widgetId, 
    itemId, 
    isJiggleMode, 
    onRemove, 
    onEdit, 
    size = '2x2',
    isDragging,
    style,
    ...props
}, ref) => {
    const { t } = useI18n();
    
    const widgetConfig = findWidget(widgetId);
    if (!widgetConfig) {
        return <div className="bg-red-500 rounded-2xl p-2 col-span-2 row-span-2">Invalid widget: {widgetId}</div>;
    }
    const WidgetComponent = widgetConfig.component;
    
    const sizeClasses = {
        '2x2': 'col-span-2 row-span-2',
        '2x4': 'col-span-4 row-span-2',
        '4x4': 'col-span-4 row-span-4',
    };
    const appliedSize = sizeClasses[size];

    const handleClick = (e: React.MouseEvent) => {
        if (isJiggleMode) {
            e.preventDefault();
            e.stopPropagation();
            onEdit(itemId);
        }
    };
    
    const handleInteractionStart = (e: React.SyntheticEvent) => {
        e.stopPropagation();
    };

    return (
        <div 
            ref={ref}
            style={style}
            className={cn(
                "flex flex-col min-h-0 h-full", 
                appliedSize,
                isDragging && 'opacity-30'
            )}
            onTouchStart={handleInteractionStart}
            onMouseDown={handleInteractionStart}
            {...props}
        >
            <div 
                className={cn("w-full h-full flex-grow relative", isJiggleMode && !isDragging && "jiggle")}
                onClick={handleClick}
            >
                {isJiggleMode && (
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <button
                                onClick={e => e.stopPropagation()}
                                className="absolute -top-2 -left-2 w-5 h-5 bg-neutral-500 rounded-full flex items-center justify-center border border-black/10 z-10 animate-in fade-in zoom-in-50"
                            >
                                <Minus size={14} color="white" />
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-neutral-800/80 backdrop-blur-xl border-none rounded-2xl text-white w-[270px]">
                            <AlertDialogHeader className="items-center space-y-1">
                                <AlertDialogTitle className="font-semibold">{t('deleteWidget.title')}</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm text-center">
                                    {t('deleteWidget.description')}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex flex-col -mx-6 -mb-6 mt-4">
                                <AlertDialogAction onClick={onRemove} className="w-full rounded-none justify-center bg-transparent text-red-500 hover:bg-neutral-700/70 border-t border-neutral-500/30 h-11 text-base font-normal">
                                    {t('delete')}
                                </AlertDialogAction>
                                <AlertDialogCancel className="w-full rounded-none justify-center bg-transparent text-system-blue hover:bg-neutral-700/70 border-t border-neutral-500/30 mt-0 h-11 text-base font-semibold">
                                    {t('cancel')}
                                </AlertDialogCancel>
                            </div>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
                <div className={cn("w-full h-full", isJiggleMode && "pointer-events-none")} data-no-jiggle>
                    <WidgetComponent size={size} />
                </div>
            </div>
             <span className="text-center text-xs text-white drop-shadow-md mt-1 flex-shrink-0">
                {t(widgetConfig.nameKey)}
            </span>
        </div>
    );
});

WidgetWrapper.displayName = "WidgetWrapper";

export default WidgetWrapper;
