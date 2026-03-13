// Server-side YouTube API functions (for scheduled jobs and admin tasks)
import { getFirestore } from 'firebase-admin/firestore';
import { adminDb } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  thumbnail: string;
  viewCount: string;
  likeCount: string;
  publishedAt: string;
  categoryId: string;
  region: string;
  lastUpdated: Timestamp;
}

export interface YouTubeAPISearchParams {
  regionCode?: string;
  videoCategoryId?: string;
  maxResults?: number;
}

/**
 * Fetches trending videos from YouTube Data API v3
 */
export async function fetchTrendingVideos(params: YouTubeAPISearchParams = {}): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YouTube API key is not configured. Set YOUTUBE_API_KEY in environment variables.');
  }

  const {
    regionCode = 'US',
    videoCategoryId,
    maxResults = 50
  } = params;

  const endpoint = 'https://www.googleapis.com/youtube/v3/videos';
  const url = new URL(endpoint);
  
  url.searchParams.set('part', 'snippet,statistics');
  url.searchParams.set('chart', 'mostPopular');
  url.searchParams.set('regionCode', regionCode);
  url.searchParams.set('maxResults', maxResults.toString());
  url.searchParams.set('key', apiKey);
  
  if (videoCategoryId) {
    url.searchParams.set('videoCategoryId', videoCategoryId);
  }

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.items.map((item: any) => ({
      videoId: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || '',
      viewCount: item.statistics?.viewCount || '0',
      likeCount: item.statistics?.likeCount || '0',
      publishedAt: item.snippet.publishedAt,
      categoryId: item.snippet.categoryId,
      region: regionCode,
      lastUpdated: Timestamp.now()
    }));
  } catch (error) {
    console.error('Error fetching trending videos:', error);
    throw error;
  }
}

/**
 * Stores or updates videos in Firestore
 */
export async function storeVideosInFirestore(videos: YouTubeVideo[]): Promise<void> {
  try {
    const batch = adminDb.batch();
    const collectionRef = adminDb.collection('youtube_videos');

    for (const video of videos) {
      const docRef = collectionRef.doc(video.videoId);
      
      // In Firebase Admin, we can directly set with merge
      batch.set(docRef, video, { merge: true });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error storing videos in Firestore:', error);
    throw error;
  }
}

/**
 * Fetches videos from Firestore by region and category
 */
export async function getVideosFromFirestore(region: string = 'US', categoryId?: string): Promise<YouTubeVideo[]> {
  try {
    const collectionRef = adminDb.collection('youtube_videos');
    let queryRef = collectionRef.where('region', '==', region);
    
    if (categoryId) {
      queryRef = queryRef.where('categoryId', '==', categoryId);
    }

    const snapshot = await queryRef.limit(50).get();
    
    const videos: YouTubeVideo[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      videos.push(data as YouTubeVideo);
    });
    
    return videos;
  } catch (error) {
    console.error('Error fetching videos from Firestore:', error);
    return [];
  }
}

/**
 * Checks if cache is stale (older than 24 hours)
 */
export async function isCacheStale(region: string, categoryId?: string): Promise<boolean> {
  try {
    const collectionRef = adminDb.collection('youtube_videos');
    let queryRef = collectionRef.where('region', '==', region);
    
    if (categoryId) {
      queryRef = queryRef.where('categoryId', '==', categoryId);
    }

    const snapshot = await queryRef.limit(1).get();
    
    if (snapshot.empty) {
      return true; // No cache exists
    }

    const now = Timestamp.now();
    const oneDayAgo = new Timestamp(now.seconds - 86400, now.nanoseconds);
    
    // Check if any video was updated in the last 24 hours
    let hasRecentVideo = false;
    snapshot.forEach(doc => {
      const video = doc.data() as YouTubeVideo;
      if (video.lastUpdated > oneDayAgo) {
        hasRecentVideo = true;
      }
    });

    return !hasRecentVideo;
  } catch (error) {
    console.error('Error checking cache staleness:', error);
    return true;
  }
}

/**
 * Daily update job to fetch and store trending videos
 */
export async function updateYouTubeVideos(): Promise<void> {
  console.log('Starting YouTube videos update job...');
  
  // Fetch feeds for different regions and categories
  const feeds = [
    { region: 'US', categoryId: undefined, name: 'Trending Global' },
    { region: 'ES', categoryId: undefined, name: 'Trending Spain' },
    { region: 'US', categoryId: '10', name: 'Music' }, // Category 10 = Music
    { region: 'US', categoryId: '20', name: 'Gaming' }, // Category 20 = Gaming
    { region: 'US', categoryId: '28', name: 'Technology' } // Category 28 = Technology
  ];

  for (const feed of feeds) {
    try {
      console.log(`Fetching ${feed.name}...`);
      const videos = await fetchTrendingVideos({
        regionCode: feed.region,
        videoCategoryId: feed.categoryId,
        maxResults: feed.categoryId ? 30 : 20 // Less for categories, more for general trending
      });
      
      await storeVideosInFirestore(videos);
      console.log(`Stored ${videos.length} videos for ${feed.name}`);
      
      // Small delay to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error updating feed ${feed.name}:`, error);
    }
  }
  
  console.log('YouTube videos update job completed.');
}