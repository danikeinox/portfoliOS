'use client';
import Image from 'next/image';
import { useI18n } from '@/hooks/use-i18n';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

const upNext = [
    { title: 'Severance', episode: 'S1 E3', image: 'https://picsum.photos/seed/tv1/400/225', aiHint: 'dystopian office' },
    { title: 'Ted Lasso', episode: 'S2 E8', image: 'https://picsum.photos/seed/tv2/400/225', aiHint: 'soccer coach' },
    { title: 'For All Mankind', episode: 'S3 E1', image: 'https://picsum.photos/seed/tv3/400/225', aiHint: 'astronaut space' },
];

const whatToWatch = [
    { title: 'Foundation', image: 'https://picsum.photos/seed/tv4/300/450', aiHint: 'sci-fi series poster' },
    { title: 'The Morning Show', image: 'https://picsum.photos/seed/tv5/300/450', aiHint: 'drama series poster' },
    { title: 'Mythic Quest', image: 'https://picsum.photos/seed/tv6/300/450', aiHint: 'comedy series poster' },
    { title: 'Slow Horses', image: 'https://picsum.photos/seed/tv7/300/450', aiHint: 'spy thriller poster' },
];

const Tv = () => {
    const { t } = useI18n();

    return (
        <ScrollArea className="h-full w-full bg-black text-white">
            <div className="p-4 space-y-8">
                <h1 className="text-4xl font-bold tracking-tight">{t('tv.watchNow')}</h1>

                <div>
                    <h2 className="text-2xl font-bold mb-3">{t('tv.upNext')}</h2>
                    <Carousel opts={{ align: 'start', dragFree: true }} className="w-full -ml-4">
                        <CarouselContent className="">
                            {upNext.map((item, index) => (
                                <CarouselItem key={index} className="basis-2/3 md:basis-1/2 lg:basis-1/3">
                                    <div className="group">
                                        <div className="rounded-xl overflow-hidden aspect-video relative">
                                            <Image src={item.image} alt={item.title} width={400} height={225} data-ai-hint={item.aiHint}/>
                                            <div className="absolute inset-0 bg-black/20"></div>
                                            <div className="absolute bottom-2 left-2 w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Play className="ml-1 text-white"/>
                                            </div>
                                        </div>
                                        <h3 className="font-semibold mt-2">{item.title}</h3>
                                        <p className="text-sm text-neutral-400">{item.episode}</p>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>
                 <div>
                    <h2 className="text-2xl font-bold mb-3">{t('tv.whatToWatch')}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                         {whatToWatch.map((item) => (
                            <div key={item.title} className="group">
                                <div className="rounded-xl overflow-hidden aspect-[2/3] relative">
                                    <Image src={item.image} alt={item.title} width={300} height={450} data-ai-hint={item.aiHint} className="w-full h-full object-cover"/>
                                </div>
                                <h3 className="font-semibold mt-2 truncate">{item.title}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ScrollArea>
    );
};

export default Tv;
