// Client-side YouTube data fetching (for React components)
import { collection, query, where, getDocs, limit, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase-client';

export interface YouTubeVideoClient {
  videoId: string;
  title: string;
  channelTitle: string;
  channelAvatar?: string;
  thumbnail: string;
  viewCount: string;
  publishedAt: string;
}

// In-memory lock to prevent multiple concurrent API refresh requests
let refreshPromise: Promise<void> | null = null;

/**
 * Fetches videos from Firestore for client-side rendering
 */
export async function fetchYouTubeVideos(region: string = 'US', categoryId?: string, limitCount: number = 20): Promise<YouTubeVideoClient[]> {
  try {
    const collectionRef = collection(db, 'youtube_videos');
    let q = query(
      collectionRef,
      where('region', '==', region),
      orderBy('lastUpdated', 'desc'),
      limit(limitCount)
    );
    
    if (categoryId) {
      q = query(q, where('categoryId', '==', categoryId));
    }

    let snapshot = await getDocs(q);
    
    let needsRefresh = false;

    if (snapshot.empty) {
      console.log(`[YouTube Cache] MISS - No videos found for region ${region}. Fetching new data...`);
      needsRefresh = true;
    } else {
      // Check if the data is older than 24 hours
      const firstDoc = snapshot.docs[0].data();
      const lastUpdatedStr = firstDoc.lastUpdated;
      
      if (lastUpdatedStr) {
        const lastUpdatedDate = new Date(lastUpdatedStr);
        const now = new Date();
        const diffMs = now.getTime() - lastUpdatedDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours >= 24) {
           console.log(`[YouTube Cache] MISS - Data is older than 24h (${diffHours.toFixed(1)}h). Fetching new data...`);
           needsRefresh = true;
        } else {
           console.log(`[YouTube Cache] HIT - Data is fresh (${diffHours.toFixed(1)}h old).`);
        }
      } else {
         console.log(`[YouTube Cache] MISS - No lastUpdated field found. Fetching new data...`);
         needsRefresh = true;
      }
    }

    if (needsRefresh) {
        if (!refreshPromise) {
            console.log(`[YouTube Cache] Initiating API Refresh Request...`);
            refreshPromise = fetch(`/api/youtube/refresh?region=${region}`).then(async (refreshRes) => {
                if (!refreshRes.ok) {
                    console.error('[YouTube Cache] Failed to refresh videos via API:', await refreshRes.text());
                } else {
                    console.log(`[YouTube Cache] Cache refreshed successfully.`);
                }
            }).catch((apiError) => {
                console.error('[YouTube Cache] Failed to call refresh API:', apiError);
            }).finally(() => {
                refreshPromise = null;
            });
        } else {
            console.log(`[YouTube Cache] API Refresh already in progress, waiting...`);
        }

        // Wait for the refresh to finish (whether we initiated it or matched an ongoing one)
        await refreshPromise;
        
        // Re-fetch from Firestore to get the newly updated data (or original data if failed)
        snapshot = await getDocs(q);
    }

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        videoId: data.videoId,
        title: data.title,
        channelTitle: data.channelTitle,
        channelAvatar: data.channelAvatar,
        thumbnail: data.thumbnail,
        viewCount: formatViewCount(data.viewCount),
        publishedAt: formatPublishedTime(data.publishedAt)
      };
    });
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
}

/**
 * Formats view count to readable format (1K, 1M, 1B)
 */
function formatViewCount(count: string): string {
  const num = parseInt(count, 10);
  if (isNaN(num)) return '0 views';
  
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B views`;
  } else if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M views`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K views`;
  }
  return `${num} views`;
}

/**
 * Formats published time to relative format (2 weeks ago, 3 months ago, etc.)
 */
function formatPublishedTime(publishedAt: string): string {
  const publishedDate = new Date(publishedAt);
  const now = new Date();
  const diffMs = now.getTime() - publishedDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    }
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  }
}

/**
 * Searches videos by title or channel (client-side filtering)
 */
export async function searchYouTubeVideos(searchQuery: string, pageToken?: string): Promise<{ videos: YouTubeVideoClient[], nextPageToken: string }> {
  try {
    if (!searchQuery.trim()) {
      return { videos: [], nextPageToken: '' };
    }
    
    console.log(`[YouTube Search] Fetching search for query: ${searchQuery}`, pageToken ? `(Page ${pageToken})` : '');
    
    // API Call
    const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}` + (pageToken ? `&pageToken=${pageToken}` : ''));
    
    if (!res.ok) {
        throw new Error('Failed to search videos');
    }
    
    const data = await res.json();
    
    const formattedVideos = (data.videos || []).map((doc: any) => {
        return {
            videoId: doc.videoId,
            title: doc.title,
            channelTitle: doc.channelTitle,
            channelAvatar: doc.channelAvatar,
            thumbnail: doc.thumbnail,
            viewCount: formatViewCount(doc.viewCount),
            publishedAt: formatPublishedTime(doc.publishedAt)
        };
    });

    return {
        videos: formattedVideos,
        nextPageToken: data.nextPageToken || ''
    };
  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    return { videos: [], nextPageToken: '' };
  }
}