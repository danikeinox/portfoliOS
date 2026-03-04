'use client';
import Image from 'next/image';
import { useI18n } from '@/hooks/use-i18n';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play } from 'lucide-react';

const upNext = [
    { title: 'The Daily', episode: 'A New Economic Reality', image: 'https://picsum.photos/seed/podcast1/200/200', aiHint: 'news podcast cover' },
    { title: 'How I Built This', episode: 'Patagonia: Yvon Chouinard', image: 'https://picsum.photos/seed/podcast2/200/200', aiHint: 'business podcast cover' },
];

const youMightLike = [
    { title: 'Stuff You Should Know', publisher: 'iHeartPodcasts', image: 'https://picsum.photos/seed/podcast3/200/200', aiHint: 'educational podcast cover' },
    { title: 'Radiolab', publisher: 'WNYC Studios', image: 'https://picsum.photos/seed/podcast4/200/200', aiHint: 'science podcast cover' },
    { title: 'Planet Money', publisher: 'NPR', image: 'https://picsum.photos/seed/podcast5/200/200', aiHint: 'finance podcast cover' },
];

const Podcasts = () => {
    const { t } = useI18n();

    return (
        <ScrollArea className="h-full w-full bg-black text-white">
            <div className="p-4">
                <h1 className="text-4xl font-bold tracking-tight mb-6">{t('podcasts.listenNow')}</h1>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-3">{t('podcasts.upNext')}</h2>
                    <div className="space-y-4">
                        {upNext.map((item, index) => (
                            <div key={index} className="flex gap-4 items-center p-3 bg-neutral-900 rounded-xl">
                                <Image src={item.image} alt={item.title} width={80} height={80} className="rounded-lg" data-ai-hint={item.aiHint} />
                                <div className="flex-1">
                                    <p className="text-sm text-neutral-400">{item.title}</p>
                                    <p className="font-semibold">{item.episode}</p>
                                </div>
                                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-700 active:bg-neutral-600">
                                    <Play className="ml-0.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold mb-3">{t('podcasts.youMightLike')}</h2>
                    <div className="space-y-4">
                         {youMightLike.map((item, index) => (
                            <div key={index} className="flex gap-4 items-center p-2 rounded-lg hover:bg-neutral-900 transition-colors">
                                <Image src={item.image} alt={item.title} width={100} height={100} className="rounded-lg" data-ai-hint={item.aiHint} />
                                <div className="flex-1">
                                    <p className="font-semibold">{item.title}</p>
                                    <p className="text-sm text-neutral-400">{item.publisher}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ScrollArea>
    );
};

export default Podcasts;
