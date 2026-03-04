'use client';

import { Apple, Rss, BookOpen, Briefcase, MessageSquare, Linkedin, Github } from 'lucide-react';
import { ShieldCheck } from 'lucide-react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/hooks/use-i18n';

interface Favorite {
    name: string;
    icon: React.ReactNode;
    url: string;
    bgColor: string;
    textColor?: string;
    target?: 'internal' | 'external';
}

const SafariStartPage = ({ onNavigate }: { onNavigate: (url: string) => void; }) => {
    const router = useRouter();
    const { t } = useI18n();

    const favorites: Favorite[] = [
        { name: 'Apple', icon: <Apple className="w-7 h-7" />, url: 'https://apple.com', bgColor: 'bg-neutral-200', textColor: 'text-black' },
        { name: 'Google', icon: <span className="text-3xl font-bold">G</span>, url: 'https://google.com', bgColor: 'bg-white', textColor: 'text-black' },
        { name: t('app.portfolio'), icon: <Briefcase className="w-7 h-7" />, url: '/app/portfolio', bgColor: 'bg-neutral-800', target: 'internal' },
        { name: t('app.blog'), icon: <Rss className="w-7 h-7" />, url: '/app/blog', bgColor: 'bg-orange-500', target: 'internal' },
        { name: t('app.testimonials'), icon: <MessageSquare className="w-7 h-7" />, url: '/app/testimonials', bgColor: 'bg-green-500', target: 'internal' },
        { name: t('app.github'), icon: <Github className="w-7 h-7" />, url: 'https://github.com/danikeinox', bgColor: 'bg-black', target: 'external' },
        { name: t('app.linkedin'), icon: <Linkedin className="w-7 h-7" />, url: 'https://linkedin.com/in/dcabreraa/', bgColor: 'bg-blue-600', target: 'external' },
        { name: t('app.about'), icon: <BookOpen className="w-7 h-7" />, url: '/app/about', bgColor: 'bg-sky-500', target: 'internal' },
    ];


    const handleFavoriteClick = (fav: Favorite) => {
        if (fav.target === 'internal') {
            router.push(fav.url);
        } else if (fav.target === 'external') {
            window.open(fav.url, '_blank', 'noopener,noreferrer');
        } else {
            onNavigate(fav.url);
        }
    };

    return (
        <div className="h-full w-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white p-4 sm:p-8 flex flex-col items-center overflow-y-auto">
            <div className="w-full max-w-2xl flex-grow flex flex-col justify-center">
                <div className="flex-shrink-0">
                    <h2 className="text-xl font-semibold mb-4 text-center sm:text-left">{t('safari.favorites')}</h2>
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-x-2 gap-y-4 text-center">
                        {favorites.map(fav => (
                            <button key={fav.name} onClick={() => handleFavoriteClick(fav)} className="flex flex-col items-center gap-1.5 group">
                                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105 ${fav.bgColor} ${fav.textColor || 'text-white'}`}>
                                    {fav.icon}
                                </div>
                                <span className="text-xs truncate w-full px-1 text-black dark:text-white">{fav.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-shrink-0 mt-12">
                     <h2 className="text-xl font-semibold mb-4 text-center sm:text-left">{t('safari.privacyReport')}</h2>
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 flex items-center gap-4 border border-neutral-200 dark:border-[#38383A]">
                        <ShieldCheck className="w-8 h-8 text-[#8A8A8E] dark:text-[#8E8E93] flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-sm text-black dark:text-white">{t('safari.privacyReportDesc')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SafariStartPage;
