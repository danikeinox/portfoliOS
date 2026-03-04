'use client';
import { useRef } from 'react';
import { useClickAway } from 'react-use';
import { useI18n } from '@/hooks/use-i18n';
import { LayoutGrid, SlidersHorizontal, Sparkles, LayoutPanelLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EditMenuProps {
    onClose: () => void;
    onEditPages: () => void;
    onAddWidget: () => void;
    onCustomize: () => void;
}

const EditMenu = ({ onClose, onEditPages, onAddWidget, onCustomize }: EditMenuProps) => {
    const { t } = useI18n();
    const router = useRouter();
    const ref = useRef(null);

    useClickAway(ref, onClose);

    const menuItems = [
        { 
            id: 'add-widget', 
            icon: LayoutGrid, 
            label: t('editMenu.addWidget'), 
            action: onAddWidget
        },
        { 
            id: 'customize', 
            icon: SlidersHorizontal, 
            label: t('editMenu.customize'), 
            action: onCustomize
        },
        { 
            id: 'edit-wallpaper', 
            icon: Sparkles, 
            label: t('editMenu.editWallpaper'), 
            action: () => router.push('/app/settings') 
        },
        { 
            id: 'edit-pages', 
            icon: LayoutPanelLeft, 
            label: t('editMenu.editPages'), 
            action: onEditPages 
        },
    ];

    return (
        <div ref={ref} className="absolute top-[calc(env(safe-area-inset-top,0px)+0.25rem)] left-4 w-64 bg-neutral-800/70 backdrop-blur-xl border border-white/10 rounded-2xl p-2 text-white shadow-lg animate-in fade-in zoom-in-95 duration-200 z-50">
            <ul>
                {menuItems.map((item, index) => (
                    <li key={item.id}>
                        <button 
                            onClick={() => { item.action(); onClose(); }}
                            className="w-full flex items-center gap-3 text-left p-2.5 text-sm rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </button>
                        {index < menuItems.length - 1 && <div className="h-px bg-white/10 mx-2.5" />}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default EditMenu;
