'use client';
import { useState, useEffect } from 'react';
import { Search, ArrowLeft, Mic, MoreVertical } from 'lucide-react';
import { FaYoutube } from 'react-icons/fa';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/hooks/use-i18n';
import { fetchYouTubeVideos, searchYouTubeVideos, type YouTubeVideoClient } from '@/lib/youtube-client';
import { Skeleton } from '@/components/ui/skeleton';

const YoutubeReal = () => {
    const { t } = useI18n();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVideo, setSelectedVideo] = useState<YouTubeVideoClient | null>(null);
    const [videos, setVideos] = useState<YouTubeVideoClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [region, setRegion] = useState('US');

    // Fetch initial videos on mount
    useEffect(() => {
        const loadVideos = async () => {
            setLoading(true);
            try {
                const fetchedVideos = await fetchYouTubeVideos(region);
                setVideos(fetchedVideos);
            } catch (error) {
                console.error('Error loading YouTube videos:', error);
                // Fallback to empty array if error
                setVideos([]);
            } finally {
                setLoading(false);
            }
        };

        loadVideos();
    }, [region]);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        setSearchLoading(true);
        
        try {
            const searchResults = await searchYouTubeVideos(query, region);
            setVideos(searchResults);
        } catch (error) {
            console.error('Error searching YouTube videos:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleClearSearch = async () => {
        setSearchQuery('');
        setLoading(true);
        try {
            const fetchedVideos = await fetchYouTubeVideos(region);
            setVideos(fetchedVideos);
        } catch (error) {
            console.error('Error clearing search:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegionChange = (newRegion: string) => {
        setRegion(newRegion);
        setLoading(true);
        fetchYouTubeVideos(newRegion)
            .then(setVideos)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    if (selectedVideo) {
        return (
            <div className="w-full h-full flex flex-col bg-white dark:bg-neutral-950 text-black dark:text-white">
                <div className="w-full relative">
                    <div className="aspect-video w-full bg-black">
                        <iframe
                            src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
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
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{selectedVideo.channelTitle}</p>
                     <p className="text-xs text-neutral-500 mt-1">{selectedVideo.viewCount} &bull; {selectedVideo.publishedAt}</p>
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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => { 
                                if (e.key === 'Enter') handleSearch(e.currentTarget.value);
                            }}
                            className="bg-neutral-200 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 rounded-full pl-4 pr-16 h-10"
                        />
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-16 rounded-r-full bg-neutral-300/80 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                            onClick={() => handleSearch(searchQuery)}
                            disabled={searchLoading}
                        >
                            {searchLoading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-600 border-t-transparent" />
                            ) : (
                                <Search size={20} />
                            )}
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-black dark:text-white">
                    {/* Region selector */}
                    <select
                        value={region}
                        onChange={(e) => handleRegionChange(e.target.value)}
                        className="bg-transparent text-sm border-none p-1"
                    >
                        <option value="US">🌎 US</option>
                        <option value="ES">🇪🇸 ES</option>
                    </select>
                    
                    <Button variant="ghost" size="icon" className="hidden sm:inline-flex"><Mic size={20} /></Button>
                    <Button variant="ghost" size="icon"><MoreVertical size={20} /></Button>
                </div>
            </header>

            <main className="flex-1 p-4 overflow-y-auto">
                {searchQuery && (
                    <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {t('youtube.searchResults', { query: searchQuery, count: videos.length })}
                        </p>
                        <Button variant="ghost" size="sm" onClick={handleClearSearch}>
                            Clear search
                        </Button>
                    </div>
                )}

                {loading || searchLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i} className="bg-transparent border-none rounded-none text-black dark:text-white">
                                <CardContent className="p-0">
                                    <Skeleton className="aspect-video w-full bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
                                    <div className="py-3 flex gap-3 items-start">
                                        <Skeleton className="w-9 h-9 rounded-full" />
                                        <div className="flex-1">
                                            <Skeleton className="h-4 w-full mb-2" />
                                            <Skeleton className="h-3 w-2/3 mb-1" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : videos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
                        {videos.map(video => (
                            <Card key={video.videoId} onClick={() => setSelectedVideo(video)} className="bg-transparent border-none rounded-none text-black dark:text-white cursor-pointer group">
                                <CardContent className="p-0">
                                    <div className="aspect-video w-full bg-neutral-200 dark:bg-neutral-800 rounded-xl overflow-hidden relative">
                                        <Image 
                                            src={video.thumbnail} 
                                            alt={video.title} 
                                            fill 
                                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" 
                                            className="object-cover transition-transform duration-300 group-hover:scale-105" 
                                        />
                                    </div>
                                    <div className="py-3 flex gap-3 items-start">
                                        <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex-shrink-0"></div>
                                        <div>
                                            <h3 className="font-semibold leading-snug line-clamp-2">{video.title}</h3>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{video.channelTitle}</p>
                                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{video.viewCount} &bull; {video.publishedAt}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-neutral-500 mt-16">
                        <p>{t('youtube.noVideosFound', { query: searchQuery })}</p>
                        <Button variant="outline" onClick={handleClearSearch} className="mt-4">
                            Show trending videos
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default YoutubeReal;