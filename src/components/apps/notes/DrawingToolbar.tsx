'use client';
import { Eraser, Pen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/use-i18n';

export type Tool = 'pen' | 'eraser';
export const COLORS = ['#000000', '#ffffff', '#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#007aff', '#af52de'];

interface DrawingToolbarProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  activeColor: string;
  setActiveColor: (color: string) => void;
  onClear: () => void;
}

const DrawingToolbar = ({
  activeTool, setActiveTool, activeColor, setActiveColor, onClear
}: DrawingToolbarProps) => {
    const { t } = useI18n();

    const renderToolButton = (tool: Tool, Icon: React.ElementType) => (
         <button onClick={() => setActiveTool(tool)} className={cn("p-2.5 rounded-lg", activeTool === tool ? "bg-white dark:bg-neutral-600 shadow" : "hover:bg-black/5 dark:hover:bg-white/5")}>
            <Icon size={22} />
        </button>
    );

    return (
        <div className="w-full flex-shrink-0">
            <div className="p-2 bg-neutral-200/80 dark:bg-neutral-900/80 backdrop-blur-xl border-t border-neutral-300 dark:border-neutral-800">
                <div className="flex justify-around items-center h-16 text-neutral-800 dark:text-white">
                    <div className="flex items-center gap-4">
                        {renderToolButton('pen', Pen)}
                        {renderToolButton('eraser', Eraser)}
                        <Button variant="ghost" onClick={onClear} size="icon" aria-label={t('notes.clearDrawing')}><Trash2 size={22} /></Button>
                    </div>

                    <div className="h-8 w-px bg-neutral-400 dark:bg-neutral-700" />
                    
                    <div className="flex items-center gap-3">
                        {COLORS.map(color => (
                            <button key={color} aria-label={color} onClick={() => setActiveColor(color)} className={cn("w-7 h-7 rounded-full border-2 transition-transform hover:scale-110", activeColor === color && activeTool === 'pen' ? 'border-system-yellow' : 'border-white/50')} style={{ backgroundColor: color }} />
                        ))}
                    </div>
                </div>
                <div className='h-[env(safe-area-inset-bottom)]' />
            </div>
        </div>
    );
}

export default DrawingToolbar;
