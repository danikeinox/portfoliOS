'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';

interface EditPagesViewProps {
    pages: React.ReactNode[][];
    visiblePages: boolean[];
    onVisibilityChange: (index: number, visible: boolean) => void;
    onDone: () => void;
}

const EditPagesView = ({ pages, visiblePages, onVisibilityChange, onDone }: EditPagesViewProps) => {
    const { t } = useI18n();
    const gridCells = 24; // 4 columns x 6 rows
    
    return (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-2xl z-50 flex flex-col animate-in fade-in">
            <div className="w-full text-right p-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
                 <button onClick={onDone} className="bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg backdrop-blur-md shadow-lg">
                    {t('home.ok')}
                </button>
            </div>
            <div className="flex-1 flex items-center justify-center">
                 <div className="flex gap-8 overflow-x-auto p-8 snap-x snap-mandatory">
                    {pages.map((page, index) => (
                        <div key={index} className="flex flex-col items-center gap-4 snap-center">
                            <div className="w-40 h-80 md:w-52 md:h-96 bg-white/10 backdrop-blur-lg rounded-3xl p-3 border border-white/20 shadow-2xl transform scale-90">
                                <div className={"grid grid-cols-4 gap-2 h-full w-full opacity-50"}>
                                    {[...Array(gridCells)].map((_, i) => (
                                        <div key={i} className="bg-white/20 rounded-md aspect-square" />
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => onVisibilityChange(index, !visiblePages[index])} className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center">
                                {visiblePages[index] ? (
                                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                        <Check size={16} color="white" />
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-white/50" />
                                )}
                            </button>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    );
};

export default EditPagesView;
