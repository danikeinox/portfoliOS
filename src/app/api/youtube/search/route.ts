import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { google } from 'googleapis';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const youtube = google.youtube({
    version: 'v3',
    auth: YOUTUBE_API_KEY,
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');
        const pageToken = searchParams.get('pageToken') || '';

        if (!q) {
            return NextResponse.json({ error: 'Missing query' }, { status: 400 });
        }

        const queryId = `${q.toLowerCase().trim()}_${pageToken || 'first'}`;
        const searchDocRef = adminDb.collection('youtube_searches').doc(queryId);
        const searchDoc = await searchDocRef.get();

        if (searchDoc.exists) {
            console.log(`[YouTube Search] Cache HIT for query: ${queryId}`);
            return NextResponse.json(searchDoc.data());
        }

        console.log(`[YouTube Search] Cache MISS for query: ${queryId}. Fetching from YouTube API...`);

        // 1. Fetch from YouTube Search API
        const searchRes = await youtube.search.list({
            part: ['snippet'],
            q: q,
            type: ['video'],
            maxResults: 3,
            pageToken: pageToken || undefined,
        });

        const items = searchRes.data.items || [];
        const nextToken = searchRes.data.nextPageToken || '';

        if (items.length === 0) {
            return NextResponse.json({ error: 'No videos found', videos: [] }, { status: 404 });
        }

        const videoIds = items.map(item => item.id?.videoId).filter(Boolean) as string[];

        // 2. Fetch video stats
        const videosRes = await youtube.videos.list({
            part: ['snippet', 'statistics'],
            id: videoIds,
        });

        const videoItems = videosRes.data.items || [];

        // 3. Fetch channel avatars
        const channelIds = Array.from(new Set(videoItems.map((item) => item.snippet?.channelId).filter(Boolean))) as string[];
        const channelAvatars: Record<string, string> = {};
        
        if (channelIds.length > 0) {
            try {
                const channelsResponse = await youtube.channels.list({
                    part: ['snippet'],
                    id: channelIds,
                });
                
                channelsResponse.data.items?.forEach((channel) => {
                    if (channel.id && channel.snippet?.thumbnails) {
                        channelAvatars[channel.id] = channel.snippet.thumbnails.default?.url || channel.snippet.thumbnails.medium?.url || '';
                    }
                });
            } catch (err) { }
        }

        // 4. Format and save to Firestore
        const now = new Date();
        const batch = adminDb.batch();

        const formattedVideos = videoItems.map((item) => {
            const videoId = item.id!;
            const snippet = item.snippet!;
            const statistics = item.statistics!;
            const channelId = snippet.channelId!;

            const thumbnail = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '';

            const videoData = {
                videoId,
                region: 'SEARCH', // Isolated region, won't show up in normal trending (US, ES) queries
                title: snippet.title || '',
                channelTitle: snippet.channelTitle || '',
                channelAvatar: channelAvatars[channelId] || '',
                thumbnail,
                viewCount: statistics.viewCount || '0',
                publishedAt: snippet.publishedAt || now.toISOString(),
                categoryId: snippet.categoryId || '',
                lastUpdated: now.toISOString(),
                isSearchResult: true
            };

            const docRef = adminDb.collection('youtube_videos').doc(videoId);
            batch.set(docRef, videoData, { merge: true });

            return videoData;
        });

        const searchPayload = {
            query: q,
            videos: formattedVideos,
            nextPageToken: nextToken
        };

        // Cache the search query result forever
        batch.set(searchDocRef, searchPayload);

        await batch.commit();

        return NextResponse.json(searchPayload);
        
    } catch (error) {
        console.error('[YouTube Search] Error:', error);
        return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
    }
}
