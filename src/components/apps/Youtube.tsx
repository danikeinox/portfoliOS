'use client';
import { useState, useMemo } from 'react';
import { Search, ArrowLeft, Mic, MoreVertical } from 'lucide-react';
import { FaYoutube } from 'react-icons/fa';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/hooks/use-i18n';

interface Video {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  views: string;
  published: string;
}

const mockData: Video[] = [
  { id: 'rEassf2_Sms', title: "Next.js 15 - React Compiler, New Features, and More!", channel: 'Vercel', thumbnail: 'https://i.ytimg.com/vi/rEassf2_Sms/hqdefault.jpg', views: '1M views', published: '2 weeks ago' },
  { id: 'L_LUpnjgPso', title: "The Real World of Next.js", channel: 'Theo - t3.gg', thumbnail: 'https://i.ytimg.com/vi/L_LUpnjgPso/hqdefault.jpg', views: '235K views', published: '3 months ago' },
  { id: '3tmd-ClpJxA', title: "LEARN REACT JS in 5 MINUTES (2024)", channel: 'Web Dev Simplified', thumbnail: 'https://i.ytimg.com/vi/3tmd-ClpJxA/hqdefault.jpg', views: '50K views', published: '4 months ago' },
  { id: 'T-i6tq3I-cE', title: "I built a REALTIME chat app in 7 minutes", channel: 'Fireship', thumbnail: 'https://i.ytimg.com/vi/T-i6tq3I-cE/hqdefault.jpg', views: '540K views', published: '5 days ago' },
  { id: 'dQw4w9WgXcQ', title: "Rick Astley - Never Gonna Give You Up", channel: 'Rick Astley', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', views: '1.5B views', published: '14 years ago' },
  { id: 'Yf-p-2y4-pI', title: "The new Firebase is kinda wild...", channel: 'Fireship', thumbnail: 'https://i.ytimg.com/vi/Yf-p-2y4-pI/hqdefault.jpg', views: '201k views', published: '3 weeks ago' },
];

const Youtube = () => {
    const { t } = useI18n();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    }

    const filteredVideos = useMemo(() => {
        if (!searchQuery) return mockData;
        return mockData.filter(video =>
            video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            video.channel.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);


    if (selectedVideo) {
        return (
            <div className="w-full h-full flex flex-col bg-white dark:bg-neutral-950 text-black dark:text-white">
                <div className="w-full relative">
                    <div className="aspect-video w-full bg-black">
                        <iframe
                            src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                            title={selectedVideo.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                    </div>
                     <Button onClick={() => setSelectedVideo(null)} variant="ghost" className="absolute top-2 left-2 text-black dark:text-white bg-white/40 dark:bg-black/40 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-black/60 rounded-full h-8 w-8 p-0">
                        <ArrowLeft size={20} />
                    </Button>
                </div>
                <div className="p-3 overflow-y-auto">
                    <h1 className="text-lg font-bold text-black dark:text-white">{selectedVideo.title}</h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{selectedVideo.channel}</p>
                     <p className="text-xs text-neutral-500 mt-1">{selectedVideo.views} &bull; {selectedVideo.published}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            <header className="p-2 flex items-center justify-between gap-2 flex-shrink-0 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <FaYoutube className="text-red-600 text-3xl" />
                    <span className="font-semibold text-lg tracking-tight hidden sm:block text-black dark:text-white">YouTube</span>
                </div>
                <div className="flex-1 flex justify-center items-center max-w-lg">
                     <div className="relative w-full">
                        <Input
                            type="text"
                            placeholder={t('youtube.search')}
                            defaultValue={searchQuery}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(e.currentTarget.value) }}
                            className="bg-neutral-200 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 rounded-full pl-4 pr-16 h-10"
                        />
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-16 rounded-r-full bg-neutral-300/80 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                            onClick={() => {
                                const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                                if (input) handleSearch(input.value);
                            }}
                        >
                            <Search size={20} />
                        </Button>
                    </div>
                </div>
                <div className="flex items-center text-black dark:text-white">
                    <Button variant="ghost" size="icon" className="hidden sm:inline-flex"><Mic size={20} /></Button>
                    <Button variant="ghost" size="icon"><MoreVertical size={20} /></Button>
                </div>
            </header>

            <main className="flex-1 p-4 overflow-y-auto">
                {filteredVideos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
                        {filteredVideos.map(video => (
                            <Card key={video.id} onClick={() => setSelectedVideo(video)} className="bg-transparent border-none rounded-none text-black dark:text-white cursor-pointer group">
                                <CardContent className="p-0">
                                    <div className="aspect-video w-full bg-neutral-200 dark:bg-neutral-800 rounded-xl overflow-hidden relative">
                                        <Image src={video.thumbnail} alt={video.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-300 group-hover:scale-105" data-ai-hint="video thumbnail" />
                                    </div>
                                    <div className="py-3 flex gap-3 items-start">
                                        <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex-shrink-0"></div>
                                        <div>
                                            <h3 className="font-semibold leading-snug line-clamp-2">{video.title}</h3>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{video.channel}</p>
                                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{video.views} &bull; {video.published}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-neutral-500 mt-16">
                        <p>{t('youtube.noVideosFound', { query: searchQuery })}</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Youtube;
