'use client';
import { useHomeScreen } from '@/hooks/use-home-screen';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { SortableItem } from './HomeScreen';
import { cn } from '@/lib/utils';

interface DockProps {
    isJiggleMode: boolean;
}

const Dock = ({ isJiggleMode }: DockProps) => {
  const { dockItems, removeItem } = useHomeScreen();
  const { setNodeRef } = useDroppable({ id: 'dock', data: { type: 'container' } });

  const onRemoveItem = (id: string) => {
    removeItem(id);
  }

  return (
    <footer className="w-full flex justify-center px-4 z-20 absolute left-0 right-0 bottom-[calc(env(safe-area-inset-bottom)_+_0.5rem)]">
        <div 
            ref={setNodeRef}
            className={cn(
                "flex justify-center items-center space-x-2 md:space-x-4 p-2.5 bg-white/20 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-lg w-full max-w-xs md:max-w-md h-24",
                 isJiggleMode && 'z-50' // Ensure dock is above other elements in jiggle mode
            )}
        >
            <SortableContext items={dockItems.map(i => i.id)} strategy={horizontalListSortingStrategy}>
                <div className="flex justify-around items-center h-full w-full">
                    {dockItems.map((item) => (
                        <SortableItem 
                            key={item.id} 
                            id={item.id} 
                            item={item} 
                            isJiggleMode={isJiggleMode} 
                            onRemove={() => onRemoveItem(item.id)} 
                            onEdit={() => {}}
                            isDock={true}
                        />
                    ))}
                </div>
            </SortableContext>
        </div>
    </footer>
  );
};

export default Dock;
