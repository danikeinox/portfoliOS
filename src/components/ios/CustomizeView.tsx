'use client';
import { useI18n } from '@/hooks/use-i18n';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomizeViewProps {
    onClose: () => void;
}

const CustomizeView = ({ onClose }: CustomizeViewProps) => {
    const { t } = useI18n();

    const fontOptions = ['Default', 'Serif', 'Monospace'];
    const colorOptions = ['#FFFFFF', '#FF3B30', '#34C759', '#007AFF', '#AF52DE', '#FF9500'];

    return (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-md z-50 flex flex-col animate-in fade-in p-4 justify-end items-center" onClick={onClose}>
            <div className="bg-neutral-800/80 backdrop-blur-xl rounded-2xl p-4 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{t('editMenu.customize')}</h2>
                    <Button onClick={onClose} className="bg-neutral-700 hover:bg-neutral-600 rounded-full h-auto px-4 py-1.5">{t('done')}</Button>
                </div>
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-neutral-300 mb-3">{t('customize.font')}</h3>
                        <div className="flex gap-3">
                            {fontOptions.map(font => (
                                <Button key={font} variant="outline" className="border-neutral-600 bg-neutral-900/80 hover:bg-neutral-700 h-auto flex-1 py-2">
                                    {font}
                                </Button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold text-neutral-300 mb-3">{t('customize.color')}</h3>
                        <div className="flex justify-between gap-2">
                             {colorOptions.map(color => (
                                <button key={color} className="w-9 h-9 rounded-full border-2 border-white/20 transition-transform hover:scale-110" style={{ backgroundColor: color }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomizeView;
