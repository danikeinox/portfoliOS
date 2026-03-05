"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Newspaper } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useI18n } from '@/hooks/use-i18n';

type NewsStory = {
    uuid: string;
    title: string;
    snippet?: string;
    source?: string;
    url: string;
    image_url?: string;
};

async function getNews(locale: string): Promise<NewsStory[]> {
    const response = await fetch(`/api/news?locale=${encodeURIComponent(locale)}`, {
        cache: 'no-store',
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message = typeof payload?.error === 'string' ? payload.error : 'Failed to fetch news';
        const code = typeof payload?.code === 'string' ? payload.code : 'NEWS_ERROR';
        throw new Error(`${code}:${message}`);
    }

    return Array.isArray(payload?.data) ? payload.data : [];
}

const News = () => {
    const { t, locale } = useI18n();
    const [news, setNews] = useState<NewsStory[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getNews(locale);
                if (!mounted) return;
                setNews(data);
            } catch (e: any) {
                if (!mounted) return;
                setError(typeof e?.message === 'string' ? e.message : 'NEWS_ERROR:Failed to fetch news');
                setNews([]);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        load();

        return () => {
            mounted = false;
        };
    }, [locale]);

    if (error?.includes('MISSING_NEWS_API_KEY')) {
        return (
            <div className="w-full min-h-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white p-4 text-center flex items-center justify-center">
                <Alert variant="destructive" className="max-w-md">
                    <AlertTriangle />
                    <AlertTitle>{t('news.configError.title')}</AlertTitle>
                    <AlertDescription>
                        {t('news.configError.description')}
                        <div className="mt-2 p-2 bg-red-100 dark:bg-neutral-800 rounded-md text-xs text-left">
                            <pre className="whitespace-pre-wrap break-all">
                                NEWS_API_KEY=your_api_key_here
                            </pre>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    const mainStory = news.length > 0 ? news[0] : null;
    const topStories = news.length > 1 ? news.slice(1, 5) : [];

    return (
        <ScrollArea className="h-full w-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white">
            <div className="max-w-xl mx-auto py-4 px-4">
                <header className="mb-4 border-b border-neutral-200 dark:border-[#38383A] pb-2">
                    <p className="text-sm text-[#8A8A8E] dark:text-[#8E8E93] font-medium">{new Date().toLocaleDateString(locale, { weekday: 'long' })}</p>
                    <h1 className="text-4xl font-bold tracking-tight text-red-600">{t('app.news')}</h1>
                </header>

                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle />
                        <AlertTitle>{t('news.error.title')}</AlertTitle>
                        <AlertDescription>{t('news.error.description')}</AlertDescription>
                    </Alert>
                )}

                {isLoading && !error && (
                    <div className="text-center text-[#8A8A8E] dark:text-[#8E8E93] py-24 bg-white dark:bg-[#1C1C1E] rounded-xl">
                        <Newspaper className="w-12 h-12 mx-auto text-[#8A8A8E] dark:text-[#8E8E93] mb-4 animate-pulse" />
                        <p className="text-sm mt-2 max-w-xs mx-auto">Loading...</p>
                    </div>
                )}

                {!isLoading && !error && news.length === 0 && (
                    <div className="text-center text-[#8A8A8E] dark:text-[#8E8E93] py-24 bg-white dark:bg-[#1C1C1E] rounded-xl">
                        <Newspaper className="w-12 h-12 mx-auto text-[#8A8A8E] dark:text-[#8E8E93] mb-4" />
                        <p className="text-lg font-semibold text-black dark:text-white">{t('news.noNews.title')}</p>
                        <p className="text-sm mt-2 max-w-xs mx-auto">{t('news.noNews.description')}</p>
                    </div>
                )}

                {mainStory && (
                    <div className="mb-6">
                        <a href={mainStory.url} target="_blank" rel="noopener noreferrer">
                            <p className="font-bold text-lg mb-1">{t('news.topStories')}</p>
                            <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden border border-neutral-200 dark:border-[#38383A] group">
                                <Image
                                    src={mainStory.image_url || 'https://picsum.photos/seed/news-fallback/800/450'}
                                    alt={mainStory.title}
                                    width={800} height={450}
                                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                                    data-ai-hint="news article"
                                />
                                <div className="p-4 bg-white dark:bg-[#1C1C1E]">
                                    <p className="text-xs font-semibold text-[#8A8A8E] dark:text-[#8E8E93] uppercase">{mainStory.source}</p>
                                    <h2 className="text-xl font-bold leading-tight mt-1 group-hover:text-red-600 transition-colors">{mainStory.title}</h2>
                                    <p className="text-sm text-[#8A8A8E] dark:text-[#8E8E93] mt-1 line-clamp-2">{mainStory.snippet}</p>
                                </div>
                            </div>
                        </a>
                    </div>
                )}

                {topStories.length > 0 && (
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden">
                        {topStories.map((story) => (
                            <a href={story.url} target="_blank" rel="noopener noreferrer" key={story.uuid}>
                                <div className="group border-b border-neutral-200 dark:border-[#38383A] last:border-none ml-4 py-4 pr-4">
                                    <div className="flex gap-4 items-center">
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-[#8A8A8E] dark:text-[#8E8E93] uppercase">{story.source}</p>
                                            <h3 className="font-bold leading-tight mt-1 group-hover:text-red-600 transition-colors">{story.title}</h3>
                                        </div>
                                        <Image
                                            src={story.image_url || 'https://picsum.photos/seed/news-fallback-small/200/200'}
                                            alt={story.title}
                                            width={80} height={80}
                                            className="rounded-lg aspect-square object-cover"
                                            data-ai-hint="news thumbnail"
                                        />
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </ScrollArea>
    );
};

export default News;
