'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { ListMusic, Home, Search, Loader2, Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { SiSpotify } from 'react-icons/si';
import { useI18n } from '@/hooks/use-i18n';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

type SpotifyPreviewTrack = {
    id: string;
    title: string;
    artist: string;
    albumImageUrl: string;
    previewUrl: string;
};

const FALLBACK_COVER = 'https://picsum.photos/seed/spotify-preview/100/100';

const parseJsonSafe = async (response: Response) => {
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
};

const getTrackTitle = (track: any) => track?.name ?? 'Unknown track';
const getArtistNames = (track: any) => {
    const names = Array.isArray(track?.artists)
        ? track.artists.map((artist: any) => artist?.name).filter(Boolean)
        : [];
    return names.length ? names.join(', ') : 'Unknown artist';
};
const getTrackImage = (track: any, fallbackSeed = 'spotify-preview') =>
    track?.album?.images?.[0]?.url ?? `https://picsum.photos/seed/${fallbackSeed}/100/100`;
const getPlaylistImage = (playlist: any, fallbackSeed = 'spotify-playlist') =>
    playlist?.images?.[0]?.url ?? `https://picsum.photos/seed/${fallbackSeed}/100/100`;
const getPlaylistOwner = (playlist: any) => playlist?.owner?.display_name ?? 'Spotify';

// Custom hook for fetching spotify data
const useSpotifyData = (action: string, params?: Record<string, string>) => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (isBackgroundRefresh = false) => {
        if (!isBackgroundRefresh) {
            setIsLoading(true);
        }
        setError(null);
        try {
            const query = new URLSearchParams({ action, ...params }).toString();
            const response = await fetch(`/api/spotify?${query}`);
            const result = await parseJsonSafe(response);

            if (!response.ok) {
                const apiError = typeof result === 'object' && result && 'error' in result
                    ? (result as any).error
                    : null;
                throw new Error(apiError || 'Failed to fetch data');
            }

            if (response.status === 204) {
                setData(null);
            } else {
                setData(result);
            }
        } catch (err: any) {
            setError(err?.message ?? 'Unexpected Spotify error');
        } finally {
            if (!isBackgroundRefresh) {
                setIsLoading(false);
            }
        }
    }, [action, JSON.stringify(params)]); // Use JSON.stringify to compare params object

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
};


const Spotify = () => {
    const { t } = useI18n();
    const [activeSection, setActiveSection] = useState('home');
    const [currentTrack, setCurrentTrack] = useState<SpotifyPreviewTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(30);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio();
        audio.preload = 'metadata';
        audioRef.current = audio;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
        const handleLoadedMetadata = () => setDuration(audio.duration || 30);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };
        const handleError = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.pause();
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, []);

    const playTrack = useCallback(async (track: SpotifyPreviewTrack) => {
        if (!audioRef.current || !track.previewUrl) return;

        const audio = audioRef.current;
        const isSameTrack = currentTrack?.id === track.id;

        try {
            if (isSameTrack) {
                if (audio.paused) {
                    await audio.play();
                    setIsPlaying(true);
                } else {
                    audio.pause();
                    setIsPlaying(false);
                }
                return;
            }

            audio.pause();
            audio.src = track.previewUrl;
            audio.currentTime = 0;
            setCurrentTime(0);
            setDuration(30);
            setCurrentTrack(track);
            await audio.play();
            setIsPlaying(true);
        } catch {
            setIsPlaying(false);
        }
    }, [currentTrack?.id]);

    const togglePlayPause = useCallback(async () => {
        if (!audioRef.current || !currentTrack) return;
        try {
            if (audioRef.current.paused) {
                await audioRef.current.play();
                setIsPlaying(true);
            } else {
                audioRef.current.pause();
                setIsPlaying(false);
            }
        } catch {
            setIsPlaying(false);
        }
    }, [currentTrack]);

    const progressPercent = useMemo(() => {
        if (!duration) return 0;
        return Math.min((currentTime / duration) * 100, 100);
    }, [currentTime, duration]);

    const formatTime = (seconds: number) => {
        const safeSeconds = Math.max(0, Math.floor(seconds));
        const mins = Math.floor(safeSeconds / 60);
        const secs = safeSeconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'home': return <HomeContent onPlayTrack={playTrack} />;
            case 'search': return <SearchContent onPlayTrack={playTrack} />;
            case 'library': return <LibraryContent onPlayTrack={playTrack} />;
            default: return <HomeContent onPlayTrack={playTrack} />;
        }
    }

    return (
        <div className="w-full h-full flex flex-col bg-black text-white">
            <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                    {renderContent()}
                </ScrollArea>
            </div>

            {currentTrack && (
                <div className="flex-shrink-0 px-2 pb-2">
                    <div className="rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <Image src={currentTrack.albumImageUrl} alt={currentTrack.title} width={44} height={44} className="rounded-md" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate">{currentTrack.title}</p>
                                    <p className="text-xs text-neutral-400 truncate">{currentTrack.artist}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="text-neutral-500" aria-label="Previous preview" disabled>
                                    <SkipBack size={18} />
                                </button>
                                <button onClick={togglePlayPause} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center" aria-label={isPlaying ? 'Pause preview' : 'Play preview'}>
                                    {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                                </button>
                                <button className="text-neutral-500" aria-label="Next preview" disabled>
                                    <SkipForward size={18} />
                                </button>
                                <Volume2 size={16} className="text-neutral-400" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-neutral-400">
                            <span>{formatTime(currentTime)}</span>
                            <div className="flex-1 h-1 bg-neutral-700 rounded-full overflow-hidden">
                                <div className="h-full bg-white" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-shrink-0 bg-gradient-to-t from-black via-black/80 to-black/0 pb-[max(env(safe-area-inset-bottom),8px)]">
                <div className="flex items-center h-16 pt-2 text-neutral-400">
                    <button onClick={() => setActiveSection('home')} className={cn("flex-1 flex flex-col items-center justify-center gap-1 transition-colors", activeSection === 'home' ? 'text-white' : 'hover:text-white')}>
                        <Home size={24} />
                        <span className="text-xs font-semibold">{t('spotify.home')}</span>
                    </button>
                    <button onClick={() => setActiveSection('search')} className={cn("flex-1 flex flex-col items-center justify-center gap-1 transition-colors", activeSection === 'search' ? 'text-white' : 'hover:text-white')}>
                        <Search size={24} />
                        <span className="text-xs font-semibold">{t('spotify.search')}</span>
                    </button>
                    <button onClick={() => setActiveSection('library')} className={cn("flex-1 flex flex-col items-center justify-center gap-1 transition-colors", activeSection === 'library' ? 'text-white' : 'hover:text-white')}>
                        <ListMusic size={24} />
                        <span className="text-xs font-semibold">{t('spotify.library')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const LoadingSpinner = () => (
    <div className="w-full h-full flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
    </div>
)

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="p-4 text-center text-red-400">
        <p>Error: {message}</p>
    </div>
)

const createPreviewTrackFromTrack = (track: any): SpotifyPreviewTrack | null => {
    if (!track?.preview_url || !track?.id) return null;
    return {
        id: track.id,
        title: getTrackTitle(track),
        artist: getArtistNames(track),
        albumImageUrl: getTrackImage(track),
        previewUrl: track.preview_url,
    };
};

const HomeContent = ({ onPlayTrack }: { onPlayTrack: (track: SpotifyPreviewTrack) => void }) => {
    const { t } = useI18n();
    const { data: nowPlaying, isLoading: isNowPlayingLoading, error: nowPlayingError, refetch } = useSpotifyData('now-playing');
    const { data: recentlyPlayed, isLoading: isRecentLoading, error: recentError } = useSpotifyData('recently-played');

    const nowPlayingPreviewTrack = useMemo(() => {
        if (!nowPlaying?.previewUrl || !nowPlaying?.title) return null;
        return {
            id: nowPlaying.songUrl || `${nowPlaying.title}-${nowPlaying.artist}`,
            title: nowPlaying.title,
            artist: nowPlaying.artist ?? 'Unknown artist',
            albumImageUrl: nowPlaying.albumImageUrl ?? FALLBACK_COVER,
            previewUrl: nowPlaying.previewUrl,
        } as SpotifyPreviewTrack;
    }, [nowPlaying]);

    useEffect(() => {
        const interval = setInterval(() => refetch(true), 10000);
        return () => clearInterval(interval);
    }, [refetch]);

    return (
        <div className="bg-gradient-to-b from-green-900/50 via-black to-black p-4 space-y-8 min-h-full">
            <h1 className="text-3xl font-bold text-white mt-4">{t('spotify.home')}</h1>

            <div className="flex flex-col justify-center items-center">
                {isNowPlayingLoading ? <LoadingSpinner /> : nowPlayingError ? <ErrorDisplay message={nowPlayingError} /> : nowPlaying?.isPlaying ? (
                    <div className="group w-full max-w-sm bg-neutral-900/50 hover:bg-neutral-800/80 transition-all rounded-xl p-4 flex flex-col items-center text-center border border-neutral-800 hover:border-neutral-700">
                        <div className="relative w-48 h-48 mb-6 rounded-lg overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-300">
                            <Image src={nowPlaying.albumImageUrl ?? FALLBACK_COVER} alt={nowPlaying.album ?? 'Album cover'} fill className="object-cover" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <SiSpotify className="h-4 w-4 text-green-500 animate-pulse" />
                            <span className="text-xs font-semibold text-green-500 uppercase tracking-widest">{t('spotify.nowPlaying')}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1 line-clamp-1 w-full">{nowPlaying.title ?? 'Unknown track'}</h3>
                        <p className="text-neutral-400 text-sm line-clamp-1 w-full">{nowPlaying.artist ?? 'Unknown artist'}</p>
                        <div className="mt-4 flex items-center gap-3">
                            {nowPlayingPreviewTrack && (
                                <button onClick={() => onPlayTrack(nowPlayingPreviewTrack)} className="px-4 py-1.5 rounded-full bg-green-500 text-black text-sm font-semibold hover:bg-green-400 transition-colors">
                                    Preview 30s
                                </button>
                            )}
                            <a href={nowPlaying.songUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 rounded-full border border-neutral-600 text-sm hover:bg-neutral-800 transition-colors">
                                Abrir en Spotify
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-sm bg-neutral-900/50 rounded-xl p-8 flex flex-col items-center text-center border border-neutral-800">
                        <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                            <SiSpotify className="h-8 w-8 text-neutral-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{t('spotify.notPlayingTitle')}</h3>
                        <p className="text-neutral-400 text-sm">{t('spotify.notPlayingDescription')}</p>
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-2xl font-bold text-white mb-4">Recently Played</h2>
                {isRecentLoading ? <LoadingSpinner /> : recentError ? <ErrorDisplay message={recentError} /> : (
                    <div className="grid grid-cols-2 gap-4">
                        {recentlyPlayed?.items?.map((item: any, index: number) => {
                            const track = item.track;
                            const uniqueKey = `${item.played_at ?? track?.id ?? 'track'}-${index}`;
                            const previewTrack = createPreviewTrackFromTrack(track);
                            return (
                                <button
                                    key={uniqueKey}
                                    disabled={!previewTrack}
                                    onClick={() => previewTrack && onPlayTrack(previewTrack)}
                                    className="w-full text-left flex items-center gap-3 bg-neutral-800/50 rounded-md overflow-hidden hover:bg-neutral-800/80 transition-colors disabled:opacity-60"
                                >
                                    <Image src={getTrackImage(track, `recent-${index}`)} alt={getTrackTitle(track)} width={56} height={56} />
                                    <span className="text-sm font-semibold pr-2 truncate">{getTrackTitle(track)}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

const SearchContent = ({ onPlayTrack }: { onPlayTrack: (track: SpotifyPreviewTrack) => void }) => {
    const { t } = useI18n();
    const [query, setQuery] = useState('');
    const trimmedQuery = query.trim();
    const { data: searchData, isLoading, error, refetch } = useSpotifyData('search', { q: trimmedQuery });
    const { data: recommendations, isLoading: isRecLoading, error: recError } = useSpotifyData('recommendations');

    useEffect(() => {
        if (trimmedQuery) {
            const handler = setTimeout(() => {
                refetch();
            }, 500);
            return () => clearTimeout(handler);
        }
    }, [trimmedQuery, refetch]);

    const genreCategories = [
        { name: 'Pop', color: 'bg-blue-500' }, { name: 'Hip-Hop', color: 'bg-orange-500' },
        { name: 'Rock', color: 'bg-red-500' }, { name: 'Electronic', color: 'bg-purple-500' },
        { name: 'Latin', color: 'bg-yellow-500' }, { name: 'Indie', color: 'bg-indigo-500' }
    ];

    const renderResults = () => (
        <div className="space-y-6">
            {searchData?.tracks?.items?.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold mb-3">Songs</h3>
                    <div className="space-y-2">
                        {searchData.tracks.items.map((track: any, index: number) => {
                            const previewTrack = createPreviewTrackFromTrack(track);
                            return (
                                <button
                                    key={`${track.id ?? track.name}-${index}`}
                                    disabled={!previewTrack}
                                    onClick={() => previewTrack && onPlayTrack(previewTrack)}
                                    className="w-full text-left flex items-center gap-4 p-2 hover:bg-neutral-800 rounded-md disabled:opacity-60"
                                >
                                    <Image src={getTrackImage(track, `search-track-${index}`)} alt={getTrackTitle(track)} width={48} height={48} className="rounded-md" />
                                    <div className="truncate">
                                        <p className="font-semibold truncate">{getTrackTitle(track)}</p>
                                        <p className="text-sm text-neutral-400 truncate">{getArtistNames(track)}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            {searchData?.playlists?.items?.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold mb-3">Playlists</h3>
                    <div className="space-y-2">
                        {searchData.playlists.items.map((playlist: any, index: number) => (
                            <div key={`${playlist.id ?? playlist.name}-${index}`} className="flex items-center gap-4 p-2 hover:bg-neutral-800 rounded-md">
                                <Image src={getPlaylistImage(playlist, `search-playlist-${index}`)} alt={playlist?.name ?? 'Playlist'} width={48} height={48} className="rounded-md" />
                                <div className="truncate">
                                    <p className="font-semibold truncate">{playlist?.name ?? 'Untitled playlist'}</p>
                                    <p className="text-sm text-neutral-400 truncate">By {getPlaylistOwner(playlist)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderBrowse = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold mb-3">Browse all</h3>
                <div className="grid grid-cols-2 gap-4">
                    {genreCategories.map(cat => (
                        <div key={cat.name} className={cn("h-24 rounded-lg p-3 font-bold text-lg overflow-hidden relative", cat.color)}>
                            <span>{cat.name}</span>
                        </div>
                    ))}
                </div>
            </div>
            {isRecLoading ? <LoadingSpinner /> : recError ? <ErrorDisplay message={recError} /> : recommendations?.tracks?.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold mb-3">You might like</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {recommendations.tracks.slice(0, 4).map((track: any, index: number) => {
                            const previewTrack = createPreviewTrackFromTrack(track);
                            return (
                                <button
                                    key={`${track.id ?? track.name}-${index}`}
                                    disabled={!previewTrack}
                                    onClick={() => previewTrack && onPlayTrack(previewTrack)}
                                    className="w-full text-left space-y-2 disabled:opacity-60"
                                >
                                    <Image src={getTrackImage(track, `rec-${index}`)} alt={getTrackTitle(track)} width={200} height={200} className="rounded-lg aspect-square object-cover" />
                                    <p className="font-semibold text-sm truncate">{getTrackTitle(track)}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="p-4 bg-black min-h-full">
            <h1 className="text-3xl font-bold text-white mt-4 mb-4">{t('spotify.search')}</h1>
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                <Input
                    placeholder="What do you want to listen to?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-neutral-800 rounded-md pl-10 pr-4 py-2 text-base text-white placeholder:text-neutral-400 border-none focus:outline-none h-11"
                />
            </div>
            {isLoading ? <LoadingSpinner /> : error ? <ErrorDisplay message={error} /> : trimmedQuery ? renderResults() : renderBrowse()}
        </div>
    )
}

const LibraryContent = ({ onPlayTrack }: { onPlayTrack: (track: SpotifyPreviewTrack) => void }) => {
    const { t } = useI18n();
    const { data: playlists, isLoading: isPlaylistsLoading, error: playlistsError } = useSpotifyData('playlists');
    const { data: savedTracks, isLoading: isTracksLoading, error: tracksError } = useSpotifyData('saved-tracks');

    return (
        <div className="p-4 bg-black min-h-full space-y-8">
            <h1 className="text-3xl font-bold text-white mt-4">{t('spotify.library')}</h1>

            <div>
                <h2 className="text-xl font-bold mb-3">Playlists</h2>
                {isPlaylistsLoading ? <LoadingSpinner /> : playlistsError ? <ErrorDisplay message={playlistsError} /> : (
                    <div className="space-y-2">
                        {playlists?.items?.map((playlist: any, index: number) => (
                            <div key={`${playlist.id ?? playlist.name}-${index}`} className="flex items-center gap-4 p-2 hover:bg-neutral-800 rounded-md">
                                <Image src={getPlaylistImage(playlist, `library-playlist-${index}`)} alt={playlist?.name ?? 'Playlist'} width={56} height={56} className="rounded-md" />
                                <div className="truncate">
                                    <p className="font-semibold truncate">{playlist?.name ?? 'Untitled playlist'}</p>
                                    <p className="text-sm text-neutral-400 truncate">By {getPlaylistOwner(playlist)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Separator className="bg-neutral-800" />

            <div>
                <h2 className="text-xl font-bold mb-3">Liked Songs</h2>
                {isTracksLoading ? <LoadingSpinner /> : tracksError ? <ErrorDisplay message={tracksError} /> : (
                    <div className="space-y-2">
                        {savedTracks?.items?.map((item: any, index: number) => {
                            const track = item.track;
                            const uniqueKey = `${item.added_at ?? track?.id ?? 'saved'}-${index}`;
                            const previewTrack = createPreviewTrackFromTrack(track);
                            return (
                                <button
                                    key={uniqueKey}
                                    disabled={!previewTrack}
                                    onClick={() => previewTrack && onPlayTrack(previewTrack)}
                                    className="w-full text-left flex items-center gap-4 p-2 hover:bg-neutral-800 rounded-md disabled:opacity-60"
                                >
                                    <Image src={getTrackImage(track, `saved-${index}`)} alt={getTrackTitle(track)} width={56} height={56} className="rounded-md" />
                                    <div className="truncate">
                                        <p className="font-semibold truncate">{getTrackTitle(track)}</p>
                                        <p className="text-sm text-neutral-400 truncate">{getArtistNames(track)}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}


export default Spotify;
