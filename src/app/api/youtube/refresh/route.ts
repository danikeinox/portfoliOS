import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Google APIs
import { google } from 'googleapis';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
    console.error('YOUTUBE_API_KEY is not set');
}

const youtube = google.youtube({
    version: 'v3',
    auth: YOUTUBE_API_KEY,
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const region = searchParams.get('region') || 'US';

        console.log(`[YouTube API Refresh] Fetching fresh data from YouTube API for region: ${region}`);

        // 1. Fetch from YouTube API
        const response = await youtube.videos.list({
            part: ['snippet', 'statistics'],
            chart: 'mostPopular',
            regionCode: region,
            maxResults: 20,
        });

        const items = response.data.items || [];

        if (items.length === 0) {
            return NextResponse.json({ error: 'No videos found from YouTube API' }, { status: 404 });
        }

        // 2. Extract channel IDs to fetch avatars
        const channelIds = Array.from(new Set(items.map((item) => item.snippet?.channelId).filter(Boolean))) as string[];
        
        const channelAvatars: Record<string, string> = {};
        
        if (channelIds.length > 0) {
            try {
                const channelsResponse = await youtube.channels.list({
                    part: ['snippet'],
                    id: channelIds,
                });
                
                channelsResponse.data.items?.forEach((channel) => {
                    const id = channel.id;
                    const avatarUrl = channel.snippet?.thumbnails?.default?.url || channel.snippet?.thumbnails?.medium?.url;
                    if (id && avatarUrl) {
                        channelAvatars[id] = avatarUrl;
                    }
                });
            } catch (channelError) {
                console.error('[YouTube API Refresh] Failed to fetch channel avatars', channelError);
            }
        }

        // 3. Format the data and save to Firestore
        const now = new Date();
        const batch = adminDb.batch(); // Use batch for atomic writes

        const formattedVideos = items.map((item) => {
            const videoId = item.id!;
            const snippet = item.snippet!;
            const statistics = item.statistics!;
            const channelId = snippet.channelId!;

            // Prefer high or medium. Maxres/standard can sometimes 404 on YouTube API if the video is old.
            const thumbnail = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '';

            const videoData = {
                videoId,
                region,
                title: snippet.title || '',
                channelTitle: snippet.channelTitle || '',
                channelAvatar: channelAvatars[channelId] || '',
                thumbnail,
                viewCount: statistics.viewCount || '0',
                publishedAt: snippet.publishedAt || now.toISOString(),
                categoryId: snippet.categoryId || '',
                lastUpdated: now.toISOString(), // The key field for our 24h cache!
            };

            // Set document in Firestore
            const docRef = adminDb.collection('youtube_videos').doc(videoId);
            batch.set(docRef, videoData, { merge: true });

            return videoData;
        });

        // 3. Commit the batch writes
        await batch.commit();

        console.log(`[YouTube API Refresh] Successfully saved ${formattedVideos.length} videos to Firestore.`);

        return NextResponse.json({
            success: true,
            message: `Fetched and cached ${formattedVideos.length} videos.`,
            videos: formattedVideos,
            lastUpdated: now.toISOString()
        });
        
    } catch (error) {
        console.error('[YouTube API Refresh] Error:', error);
        return NextResponse.json(
            { error: 'Failed to refresh YouTube videos' },
            { status: 500 }
        );
    }
}
