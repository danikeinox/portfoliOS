import { NextResponse, type NextRequest } from 'next/server';

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
const RECENTLY_PLAYED_ENDPOINT = `https://api.spotify.com/v1/me/player/recently-played?limit=8`;
const TOP_TRACKS_ENDPOINT = `https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=short_term`;
const RECOMMENDATIONS_ENDPOINT = `https://api.spotify.com/v1/recommendations`;
const SEARCH_ENDPOINT = `https://api.spotify.com/v1/search`;
const PLAYLISTS_ENDPOINT = `https://api.spotify.com/v1/me/playlists?limit=20`;
const SAVED_TRACKS_ENDPOINT = `https://api.spotify.com/v1/me/tracks?limit=20`;

const parseResponseBody = async (response: Response) => {
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
};

const getAccessToken = async () => {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token!,
    }),
    cache: 'no-store',
  });
    const body = await parseResponseBody(response);
    if (!response.ok) {
        const tokenError = typeof body === 'object' && body && 'error_description' in body
            ? (body as any).error_description
            : response.statusText;
        throw new Error(`Spotify token error: ${tokenError}`);
    }
    if (!body || typeof body !== 'object' || !(body as any).access_token) {
        throw new Error('Spotify token response is empty or invalid');
    }
    return body as { access_token: string };
};

const spotifyApiRequest = async (endpoint: string, access_token: string) => {
    const response = await fetch(endpoint, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
        cache: 'no-store',
    });

    if (response.status === 204) {
        return null;
    }

    const body = await parseResponseBody(response);
    
    if (!response.ok) {
        console.error(`Spotify API Error for ${endpoint}:`, body);
        const errorMessage = typeof body === 'object' && body && 'error' in body
          ? (body as any).error?.message
          : null;
        throw new Error(`Spotify API Error: ${errorMessage || response.statusText}`);
    }
    
    return body;
}


export async function GET(request: NextRequest) {
    if (!refresh_token) {
        return NextResponse.json({ error: 'Spotify service unavailable.' }, { status: 500 });
    }

    try {
        const { access_token } = await getAccessToken();
        const action = request.nextUrl.searchParams.get('action');

        switch (action) {
            case 'now-playing': {
                const song = await spotifyApiRequest(NOW_PLAYING_ENDPOINT, access_token);
                                if (!song || !song.item) {
                  return NextResponse.json({ isPlaying: false });
                }
                const isPlaying = song.is_playing;
                const title = song.item.name ?? 'Unknown track';
                const artist = Array.isArray(song.item.artists)
                    ? song.item.artists.map((_artist: any) => _artist?.name).filter(Boolean).join(', ') || 'Unknown artist'
                    : 'Unknown artist';
                const album = song.item.album?.name ?? 'Unknown album';
                const albumImageUrl = song.item.album?.images?.[0]?.url ?? null;
                const songUrl = song.item.external_urls?.spotify ?? null;
                                const previewUrl = song.item.preview_url ?? null;
                                return NextResponse.json({ album, albumImageUrl, artist, isPlaying, songUrl, title, previewUrl });
            }
            case 'recently-played': {
                const data = await spotifyApiRequest(RECENTLY_PLAYED_ENDPOINT, access_token);
                return NextResponse.json(data);
            }
            case 'playlists': {
                const data = await spotifyApiRequest(PLAYLISTS_ENDPOINT, access_token);
                return NextResponse.json(data);
            }
            case 'saved-tracks': {
                 const data = await spotifyApiRequest(SAVED_TRACKS_ENDPOINT, access_token);
                return NextResponse.json(data);
            }
            case 'recommendations': {
                 const topTracks = await spotifyApiRequest(TOP_TRACKS_ENDPOINT, access_token);
                 if (!topTracks?.items?.length) {
                    return NextResponse.json({ tracks: [] });
                 }
                 const seed_tracks = topTracks.items.map((track: any) => track.id).join(',');
                 const data = await spotifyApiRequest(`${RECOMMENDATIONS_ENDPOINT}?seed_tracks=${seed_tracks}&limit=20`, access_token);
                 return NextResponse.json(data);
            }
            case 'search': {
                const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
                if (!q) return NextResponse.json({ tracks: { items: [] }, playlists: { items: [] } });
                const data = await spotifyApiRequest(`${SEARCH_ENDPOINT}?q=${encodeURIComponent(q)}&type=track,playlist&limit=10`, access_token);
                return NextResponse.json(data);
            }
            default:
                 return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

        }
    } catch (error: any) {
        console.error('Error in Spotify API route:', error);
        return NextResponse.json({ error: 'Spotify service unavailable.' }, { status: 500 });
    }
}
