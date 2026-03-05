'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { CarouselApi } from "@/components/ui/carousel";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { cn } from '@/lib/utils';
import AppIcon from './AppIcon';
import { FaSearch } from 'react-icons/fa';
import { useLongPress } from 'react-use';
import AppLibrary from './AppLibrary';
import EditPagesView from './EditPagesView';
import { useI18n } from '@/hooks/use-i18n';
import { useHomeScreen, type GridItem } from '@/hooks/use-home-screen';
import WidgetWrapper from './WidgetWrapper';
import EditWidgetView from './EditWidgetView';
import { findApp } from '@/lib/apps';
import { useToast } from '@/hooks/use-toast';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragEndEvent,
    type DragStartEvent,
    type DragOverEvent,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Dock from './Dock';

// Sortable Item Wrapper
export const SortableItem = ({
    id,
    item,
    isJiggleMode,
    onRemove,
    onEdit,
    isDragging,
    isDock = false
}: {
    id: string,
    item: GridItem,
    isJiggleMode: boolean,
    onRemove: (id: string) => void,
    onEdit: (id: string) => void,
    isDragging?: boolean,
    isDock?: boolean
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id,
        disabled: !isJiggleMode,
    });

    const style = {
        transform: transform ? CSS.Transform.toString(transform) : undefined,
        transition,
        zIndex: isDragging ? 10 : 'auto',
    };

    const handleInteractionStart = (e: React.SyntheticEvent) => {
        // This stops the event from bubbling to the long-press detector on the homescreen.
        e.stopPropagation();
    };

    if (item.type === 'widget' && item.widgetType) {
        return (
            <WidgetWrapper
                ref={setNodeRef}
                style={style}
                widgetId={item.widgetType}
                itemId={item.id}
                isJiggleMode={isJiggleMode}
                onRemove={() => onRemove(item.id)}
                onEdit={onEdit}
                size={item.size}
                isDragging={isDragging}
                {...attributes}
                {...listeners}
            />
        );
    }

    if (item.type === 'app' && item.appId) {
        const app = findApp(item.appId);
        if (!app) return null;
        return (
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className="relative"
                onTouchStart={handleInteractionStart}
                onMouseDown={handleInteractionStart}
            >
                <AppIcon app={app} isJiggleMode={isJiggleMode} onRemove={() => onRemove(item.id)} isDragging={isDragging} isDock={isDock} />
            </div>
        );
    }
    return null;
};

// Draggable Overlay Item
export const DraggableOverlayItem = ({ item }: { item: GridItem | null }) => {
    if (!item) return null;

    const isDockItem = item?.id.includes('-dock-');

    if (item.type === 'widget' && item.widgetType) {
        return <WidgetWrapper widgetId={item.widgetType} itemId={item.id} isJiggleMode={true} onRemove={() => { }} onEdit={() => { }} size={item.size} isDragging={true} />
    }
    if (item.type === 'app' && item.appId) {
        const app = findApp(item.appId);
        if (!app) return null;
        return <AppIcon app={app} isJiggleMode={true} isDragging={true} isDock={isDockItem} />
    }
    return null;
}

const GridPage = ({ page, isJiggleMode, removeItem, onEditWidget, activeId }: GridPageProps) => {
    const { setNodeRef } = useDroppable({ id: page.id, data: { type: 'container' } });

    return (
        <SortableContext items={page.items.map(i => i.id)} strategy={rectSortingStrategy}>
            <div
                ref={setNodeRef}
                className="h-[70dvh] md:h-[65dvh] grid grid-cols-4 grid-rows-6 gap-y-4 gap-x-2 md:gap-4 max-w-xs md:max-w-xl lg:max-w-3xl w-full mx-auto"
            >
                {page.items.map(item => (
                    <SortableItem
                        key={item.id}
                        id={item.id}
                        item={item}
                        isJiggleMode={isJiggleMode}
                        onRemove={removeItem}
                        onEdit={onEditWidget}
                        isDragging={activeId === item.id}
                    />
                ))}
            </div>
        </SortableContext>
    );
};


interface HomeScreenProps {
    isJiggleMode: boolean;
    toggleJiggleMode: (state?: boolean) => void;
    onContainerClick: () => void;
    onAppLibraryVisibilityChange: (isVisible: boolean) => void;
    isEditingPages: boolean;
    setEditingPages: (isEditing: boolean) => void;
    onPageIndexChange: (index: number) => void;
}

const HomeScreen = ({
    isJiggleMode,
    toggleJiggleMode,
    onContainerClick,
    onAppLibraryVisibilityChange,
    isEditingPages,
    setEditingPages,
    onPageIndexChange,
}: HomeScreenProps) => {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const { t } = useI18n();
    const { toast } = useToast();
    const {
        pages,
        dockItems,
        visiblePages,
        setVisiblePages,
        removeItem,
        lastAddedPageIndex,
        acknowledgeNavigation,
        moveItem,
        findItem,
    } = useHomeScreen();

    const [activeId, setActiveId] = useState<string | null>(null);
    const activeItem = activeId ? findItem(activeId) : null;

    const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
    const [showPageIndicator, setShowPageIndicator] = useState(false);
    const pageIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const dragEdgeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastClientXRef = useRef(0);
    const [isPotentialDrag, setIsPotentialDrag] = useState(false);

    const pagesToRender = useMemo(() => {
        const visibleAppPages = pages
            .map((page, index) => (visiblePages[index] ? { ...page, originalIndex: index } : null))
            .filter(Boolean) as ({ id: string; items: GridItem[], originalIndex: number })[];
        return [...visibleAppPages, { id: 'app-library', items: [], originalIndex: -1 }];
    }, [pages, visiblePages]);

    const isAppLibraryActive = useMemo(() => current === pagesToRender.length - 1, [current, pagesToRender.length]);

    const longPressCallback = useCallback(() => {
        if (!isJiggleMode && !isAppLibraryActive) {
            toggleJiggleMode(true);
        }
    }, [isJiggleMode, isAppLibraryActive, toggleJiggleMode]);

    const longPressOptions = useMemo(() => ({
        delay: 500,
        filterTaps: true,
        onStart: () => setIsPotentialDrag(true),
        onFinish: () => setIsPotentialDrag(false),
        onCancel: () => setIsPotentialDrag(false),
    }), []);

    const longPressProps = useLongPress(longPressCallback, longPressOptions);

    useEffect(() => {
        const handlePointerMove = (e: PointerEvent) => {
            lastClientXRef.current = e.clientX;
        };
        if (activeId) {
            window.addEventListener('pointermove', handlePointerMove);
        }
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
        };
    }, [activeId]);


    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: 150,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (lastAddedPageIndex !== null && api) {
            const renderIndex = pagesToRender.findIndex(p => p.originalIndex === lastAddedPageIndex);
            if (renderIndex !== -1) {
                api.scrollTo(renderIndex, true);
            }
            acknowledgeNavigation();
        }
    }, [lastAddedPageIndex, api, acknowledgeNavigation, pagesToRender]);

    useEffect(() => {
        if (!api) return;
        const handleSelect = () => {
            const selectedSnap = api.selectedScrollSnap();
            setCurrent(selectedSnap);
            onPageIndexChange(pagesToRender[selectedSnap]?.originalIndex ?? -1);
            if (isJiggleMode) return;
            if (pageIndicatorTimeoutRef.current) clearTimeout(pageIndicatorTimeoutRef.current);
            setShowPageIndicator(true);
            pageIndicatorTimeoutRef.current = setTimeout(() => setShowPageIndicator(false), 2500);
        };
        handleSelect();
        api.on("select", handleSelect);
        return () => {
            api.off("select", handleSelect);
            if (pageIndicatorTimeoutRef.current) clearTimeout(pageIndicatorTimeoutRef.current);
        };
    }, [api, isJiggleMode, onPageIndexChange, pagesToRender]);

    useEffect(() => {
        onAppLibraryVisibilityChange(isAppLibraryActive);
    }, [isAppLibraryActive, onAppLibraryVisibilityChange]);

    const handlePageVisibilityChange = (index: number, isVisible: boolean) => {
        if (!isVisible && visiblePages.filter(v => v).length === 1) return;
        const newVisibility = [...visiblePages];
        newVisibility[index] = isVisible;
        setVisiblePages(newVisibility);
    };

    const handleEditWidget = (itemId: string) => {
        if (isJiggleMode) setEditingWidgetId(itemId);
    };

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeContainer = findItem(active.id as string)?.containerId;
        const overContainer = findItem(over.id as string)?.containerId ?? (over.data.current?.type === 'container' ? over.id as string : undefined);

        if (activeContainer && overContainer && activeContainer !== overContainer) {
            moveItem(active.id as string, over.id as string, over.data.current);
        }

        if (dragEdgeTimeoutRef.current) {
            clearTimeout(dragEdgeTimeoutRef.current);
            dragEdgeTimeoutRef.current = null;
        }

        const clientX = lastClientXRef.current;
        const edgeSize = 50;

        if (clientX < edgeSize) {
            dragEdgeTimeoutRef.current = setTimeout(() => api?.scrollPrev(), 300);
        } else if (clientX > window.innerWidth - edgeSize) {
            if (current < pagesToRender.length - 2) { // Prevent scrolling into app library
                dragEdgeTimeoutRef.current = setTimeout(() => api?.scrollNext(), 300);
            }
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const success = moveItem(active.id as string, over.id as string, over.data.current);
            if (!success) {
                toast({
                    variant: 'destructive',
                    title: t('addWidget.noSpace.title'),
                    description: t('addWidget.noSpace.description')
                });
            }
        }

        if (dragEdgeTimeoutRef.current) {
            clearTimeout(dragEdgeTimeoutRef.current);
        }
        setActiveId(null);
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
        >
            <div className="h-full w-full relative" {...longPressProps}>
                <Carousel
                    setApi={setApi}
                    className="w-full h-full home-carousel"
                    opts={{ draggable: !activeId && !isPotentialDrag }}
                >
                    <CarouselContent>
                        {pagesToRender.map((page) => (
                            <CarouselItem key={page.id} className="h-full" onContextMenu={(e) => e.preventDefault()}>
                                <div
                                    className={cn("h-full w-full min-h-0", page.id !== 'app-library' && "pt-[calc(env(safe-area-inset-top)+1rem)] pb-24 px-4")}
                                    onClick={onContainerClick}
                                >
                                    {page.id !== 'app-library' ? (
                                        <GridPage
                                            page={page}
                                            isJiggleMode={isJiggleMode}
                                            removeItem={removeItem}
                                            onEditWidget={handleEditWidget}
                                            activeId={activeId}
                                        />
                                    ) : <AppLibrary />}
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>

                <DragOverlay>
                    {activeId && activeItem ? <DraggableOverlayItem item={activeItem.item} /> : null}
                </DragOverlay>

                <div className="absolute bottom-0 left-0 right-0">
                    <Dock
                        items={dockItems}
                        isJiggleMode={isJiggleMode}
                        onRemoveItem={removeItem}
                    />
                </div>


                <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+7.5rem)] left-0 right-0 flex justify-center items-center h-10 z-10 pointer-events-none">
                    <div
                        onClick={(e) => { if (isJiggleMode) { e.stopPropagation(); setEditingPages(true); } }}
                        onKeyDown={(e) => {
                            if (!isJiggleMode) return;
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingPages(true);
                            }
                        }}
                        tabIndex={isJiggleMode ? 0 : -1}
                        role={isJiggleMode ? 'button' : undefined}
                        aria-label={isJiggleMode ? t('home.edit') : undefined}
                        className={cn("bg-black/20 backdrop-blur-md rounded-full h-8 flex items-center justify-center transition-all duration-300 pointer-events-auto", (isAppLibraryActive || isJiggleMode || showPageIndicator) ? "px-5 min-w-[80px]" : "px-8 min-w-[100px]", isJiggleMode && "cursor-pointer")}
                    >
                        {isAppLibraryActive || isJiggleMode || showPageIndicator ? (
                            <div className="flex justify-center items-center space-x-1.5 animate-in fade-in zoom-in duration-200">
                                {pagesToRender.length > 1 && Array.from({ length: pagesToRender.length }).map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={(e) => { e.stopPropagation(); api?.scrollTo(index); }}
                                        aria-label={index === pagesToRender.length - 1 ? 'Ir a biblioteca de apps' : `Ir a página ${index + 1}`}
                                        className={cn("w-2 h-2 rounded-full transition-colors duration-200 pointer-events-auto cursor-pointer", current === index ? "bg-white" : "bg-white/40", index === pagesToRender.length - 1 && 'w-1.5 h-1.5', index === pagesToRender.length - 1 && current === index && 'bg-gray-300', index === pagesToRender.length - 1 && current !== index && 'bg-gray-700')}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-white/90 text-sm font-medium animate-in fade-in zoom-in duration-200">
                                <FaSearch className="w-3 h-3 text-white/70" />
                                <span>{t('home.search')}</span>
                            </div>
                        )}
                    </div>
                </div>
                {isEditingPages && (
                    <EditPagesView
                        pages={pages.map(p => p.items)}
                        visiblePages={visiblePages}
                        onVisibilityChange={handlePageVisibilityChange}
                        onDone={() => setEditingPages(false)}
                    />
                )}
                {editingWidgetId && <EditWidgetView widgetId={editingWidgetId} onClose={() => setEditingWidgetId(null)} />}
            </div>
        </DndContext>
    );
};

export default HomeScreen;
