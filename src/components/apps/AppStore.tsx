'use client';
import Image from 'next/image';
import { useI18n } from '@/hooks/use-i18n';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const mockApps = [
    { id: '1', name: 'Procreate', category: 'Creativity', icon: 'https://picsum.photos/seed/app1/100/100', aiHint: 'art app icon' },
    { id: '2', name: 'Notion', category: 'Productivity', icon: 'https://picsum.photos/seed/app2/100/100', aiHint: 'productivity app icon' },
    { id: '3', name: 'Headspace', category: 'Health & Fitness', icon: 'https://picsum.photos/seed/app3/100/100', aiHint: 'meditation app icon' },
    { id: '4', name: 'Duolingo', category: 'Education', icon: 'https://picsum.photos/seed/app4/100/100', aiHint: 'language app icon' },
];

const AppStore = () => {
    const { t, locale } = useI18n();
    const today = new Date();
    const dateString = today.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <ScrollArea className="h-full w-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white">
            <div className="max-w-xl mx-auto p-4">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] font-semibold uppercase">{dateString}</p>
                        <h1 className="text-4xl font-bold tracking-tight">{t('appstore.today')}</h1>
                    </div>
                    <Image src="https://picsum.photos/seed/profile/80/80" width={40} height={40} alt="Profile" className="rounded-full" data-ai-hint="male portrait" />
                </div>

                <div className="relative rounded-xl overflow-hidden mb-8 border border-neutral-200 dark:border-[#38383A] bg-white dark:bg-[#1C1C1E]">
                    <Image src="https://picsum.photos/seed/appstore-main/800/500" alt="Main Feature" width={800} height={500} className="w-full h-full object-cover" data-ai-hint="abstract art" />
                    <div className="absolute bottom-0 left-0 p-4 text-white bg-gradient-to-t from-black/50 to-transparent w-full">
                        <p className="text-xs font-semibold uppercase">{t('appstore.featuredApp')}</p>
                        <h2 className="text-2xl font-bold">{t('appstore.mainTitle')}</h2>
                        <p className="text-sm">{t('appstore.mainSubtitle')}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden">
                    {mockApps.map((app, index) => (
                        <div key={app.id} className="border-b border-neutral-200 dark:border-[#38383A] last:border-none ml-4 py-4 pr-4">
                            <div className="flex items-center gap-4">
                                <Image src={app.icon} alt={app.name} width={100} height={100} className="w-20 h-20 rounded-2xl bg-neutral-200" data-ai-hint={app.aiHint}/>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg">{app.name}</h3>
                                    <p className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">{app.category}</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <Button className="bg-[#0A84FF] hover:bg-[#0A84FF]/90 rounded-full font-bold text-white px-6">{t('appstore.get')}</Button>
                                    <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] mt-1">{t('appstore.inAppPurchases')}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ScrollArea>
    );
};

export default AppStore;
