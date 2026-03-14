'use client';
import { useState, useEffect } from 'react';
import { Search, ArrowLeft, Mic, MoreVertical, CheckCircle2, Loader2 } from 'lucide-react';
import { FaYoutube } from 'react-icons/fa';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/hooks/use-i18n';
import { fetchYouTubeVideos, searchYouTubeVideos, type YouTubeVideoClient } from '@/lib/youtube-client';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { sendYoutubeSupport } from '@/app/actions/youtube-support';

const YoutubeReal = () => {
    const { t } = useI18n();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVideo, setSelectedVideo] = useState<YouTubeVideoClient | null>(null);
    const [videos, setVideos] = useState<YouTubeVideoClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [region, setRegion] = useState('US');
    const [nextPageToken, setNextPageToken] = useState('');
    const [searchingMore, setSearchingMore] = useState(false);

    // Voice search
    const [isListening, setIsListening] = useState(false);

    // Support Modal
    const [supportOpen, setSupportOpen] = useState(false);
    const [supportLoading, setSupportLoading] = useState(false);
    const [supportSuccess, setSupportSuccess] = useState(false);

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

    const handleSearch = async (query: string, token?: string) => {
        if (!token) {
            setSearchQuery(query);
            setSearchLoading(true);
        } else {
            setSearchingMore(true);
        }

        try {
            const searchResults = await searchYouTubeVideos(query, token);
            if (token) {
                setVideos(prev => [...prev, ...searchResults.videos]);
            } else {
                setVideos(searchResults.videos);
            }
            setNextPageToken(searchResults.nextPageToken);
        } catch (error) {
            console.error('Error searching YouTube videos:', error);
        } finally {
            if (!token) setSearchLoading(false);
            else setSearchingMore(false);
        }
    };

    const handleClearSearch = async () => {
        setSearchQuery('');
        setNextPageToken('');
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

    const handleVoiceSearch = () => {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Tu navegador no soporta búsqueda por voz.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = region === 'ES' ? 'es-ES' : 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (e: any) => {
            console.error("Voice recognition error", e.error);
            setIsListening(false);
        };
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setSearchQuery(transcript);
            handleSearch(transcript);
        };

        recognition.start();
    };

    if (selectedVideo) {
        return (
            <div className="w-full h-full flex flex-col bg-white dark:bg-[#0f0f0f] text-black dark:text-white overflow-hidden">
                <header className="p-2 flex items-center gap-2 flex-shrink-0 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-sm z-10">
                    <Button onClick={() => setSelectedVideo(null)} variant="ghost" className="rounded-full h-10 w-10 p-0 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800">
                        <ArrowLeft size={20} />
                    </Button>
                    <div className="flex items-center gap-2">
                        <FaYoutube className="text-red-600 text-2xl" />
                        <span className="font-semibold text-lg max-md:hidden">YouTube</span>
                    </div>
                </header>

                <div className="flex-1 flex flex-col md:flex-row overflow-y-auto">
                    {/* Left Column (Video + Info) */}
                    <div className="flex-1 flex flex-col">
                        <div className="w-full bg-black flex justify-center md:p-4">
                            <div className="w-full max-w-[1280px] aspect-video">
                                <iframe
                                    src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
                                    title={selectedVideo.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full md:rounded-xl"
                                ></iframe>
                            </div>
                        </div>
                        <div className="w-full max-w-[1280px] mx-auto p-4 flex flex-col gap-4">
                            <h1 className="text-xl md:text-2xl font-bold">{selectedVideo.title}</h1>
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    {selectedVideo.channelAvatar ? (
                                        <div className="w-10 h-10 rounded-full flex-shrink-0 relative overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                                            <Image
                                                src={selectedVideo.channelAvatar}
                                                alt={selectedVideo.channelTitle}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex-shrink-0"></div>
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-sm md:text-base">{selectedVideo.channelTitle}</h3>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400">Suscriptores ocultos</p>
                                    </div>
                                    <Button className="ml-4 rounded-full bg-black text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 hidden sm:block">
                                        Suscribirse
                                    </Button>
                                    <Button size="sm" className="ml-4 rounded-full bg-black text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 sm:hidden">
                                        Sub
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-full px-4 py-2">
                                    <span className="text-sm font-medium">{selectedVideo.viewCount} views</span>
                                    <div className="w-1 h-1 rounded-full bg-neutral-400"></div>
                                    <span className="text-sm font-medium">{selectedVideo.publishedAt}</span>
                                </div>
                            </div>

                            <div className="bg-neutral-100 dark:bg-neutral-800/60 rounded-xl p-3 md:p-4 mt-2 text-sm">
                                <p className="font-medium mb-1">Descripción</p>
                                <p className="text-neutral-700 dark:text-neutral-300">Este video se reproduce usando el reproductor oficial de YouTube en un entorno enjaulado.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Suggested next videos ) */}
                    <div className="w-full md:w-[400px] p-4 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-neutral-200 dark:border-neutral-800">
                        <h3 className="font-semibold text-lg hidden md:block">Siguientes recomendados</h3>
                        <div className="flex flex-col gap-3">
                            {videos.slice(0, 8).filter(v => v.videoId !== selectedVideo.videoId).map(video => (
                                <div key={video.videoId} onClick={() => setSelectedVideo(video)} className="flex gap-2 cursor-pointer group">
                                    <div className="w-40 aspect-video relative rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800">
                                        <Image src={video.thumbnail} alt={video.title} fill className="object-cover" unoptimized />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <p className="text-sm font-semibold line-clamp-2 md:group-hover:text-blue-500">{video.title}</p>
                                        <p className="text-xs text-neutral-500 mt-1">{video.channelTitle}</p>
                                        <p className="text-xs text-neutral-500">{video.viewCount} • {video.publishedAt}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
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

                    <Button
                        variant="ghost"
                        size="icon"
                        className={`hidden sm:inline-flex ${isListening ? 'text-red-500 animate-pulse' : ''}`}
                        onClick={handleVoiceSearch}
                    >
                        <Mic size={20} />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical size={20} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                            <DropdownMenuItem
                                className="cursor-pointer dark:hover:bg-neutral-800"
                                onClick={() => {
                                    setSupportSuccess(false);
                                    setSupportOpen(true);
                                }}
                            >
                                Ayuda/Soporte
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                    <>
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
                                                unoptimized
                                            />
                                        </div>
                                        <div className="py-3 flex gap-3 items-start">
                                            {video.channelAvatar ? (
                                                <div className="w-9 h-9 rounded-full flex-shrink-0 relative overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                                                    <Image
                                                        src={video.channelAvatar}
                                                        alt={video.channelTitle}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex-shrink-0"></div>
                                            )}
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
                        {searchQuery && nextPageToken && (
                            <div className="flex justify-center mt-8 pb-8">
                                <Button variant="outline" onClick={() => handleSearch(searchQuery, nextPageToken)} disabled={searchingMore}>
                                    {searchingMore ? "Recuperando..." : "Buscar más"}
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center text-neutral-500 mt-16">
                        <p>{t('youtube.noVideosFound', { query: searchQuery })}</p>
                        <Button variant="outline" onClick={handleClearSearch} className="mt-4">
                            Show trending videos
                        </Button>
                    </div>
                )}
            </main>

            {/* Support Dialog */}
            <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-900 text-black dark:text-white border-neutral-200 dark:border-neutral-800" aria-describedby="support-dialog-desc">
                    <DialogHeader>
                        <DialogTitle>Soporte Técnico de YouTube</DialogTitle>
                        <DialogDescription id="support-dialog-desc" className="text-neutral-500 text-sm">
                            ¿Tienes algún problema? Completa este formulario.
                        </DialogDescription>
                    </DialogHeader>

                    {supportSuccess ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-4">
                            <CheckCircle2 className="w-16 h-16 text-green-500" />
                            <p className="text-center font-medium">Ticket enviado correctamente.</p>
                            <p className="text-center text-sm text-neutral-500">En 24/48 horas se responderá y proporcionará soporte a tu problema. Has recibido una copia en tu correo.</p>
                            <Button className="mt-4 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200" onClick={() => setSupportOpen(false)}>
                                Cerrar
                            </Button>
                        </div>
                    ) : (
                        <form action={async (formData) => {
                            setSupportLoading(true);
                            const res = await sendYoutubeSupport(formData);
                            setSupportLoading(false);
                            if (res.success) {
                                setSupportSuccess(true);
                            } else {
                                alert("Error al enviar el formulario: " + res.error);
                            }
                        }} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Nombre y apellidos</label>
                                <Input name="name" required placeholder="Ej: Juan Pérez" className="mt-1 bg-neutral-100 dark:bg-neutral-800 border-none" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Correo electrónico</label>
                                <Input name="email" type="email" required placeholder="tu@correo.com" className="mt-1 bg-neutral-100 dark:bg-neutral-800 border-none" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Problema</label>
                                <textarea name="problem" required placeholder="Describe tu problema con detalle..." rows={4} className="w-full rounded-md p-3 mt-1 bg-neutral-100 dark:bg-neutral-800 border-none resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                            <Button type="submit" disabled={supportLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2">
                                {supportLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {supportLoading ? 'Enviando...' : 'Enviar ticket'}
                            </Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default YoutubeReal;