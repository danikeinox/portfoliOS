// Client-side YouTube data fetching (for React components)
import { collection, query, where, getDocs, limit, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase-client';

export interface YouTubeVideoClient {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  viewCount: string;
  publishedAt: string;
}

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

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        videoId: data.videoId,
        title: data.title,
        channelTitle: data.channelTitle,
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
export async function searchYouTubeVideos(searchQuery: string, region: string = 'US'): Promise<YouTubeVideoClient[]> {
  try {
    const allVideos = await fetchYouTubeVideos(region, undefined, 50);
    
    if (!searchQuery.trim()) {
      return allVideos;
    }
    
    const queryLower = searchQuery.toLowerCase();
    return allVideos.filter(video =>
      video.title.toLowerCase().includes(queryLower) ||
      video.channelTitle.toLowerCase().includes(queryLower)
    );
  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    return [];
  }
}