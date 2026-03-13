# YouTube Integration - Real Data Feed

This integration replaces the mock YouTube feed with real data from the YouTube Data API v3, cached in Firebase Firestore.

## Features

- **Real YouTube Data**: Fetches trending videos from YouTube API
- **Firestore Cache**: Videos are cached for 24 hours to reduce API calls
- **Multiple Regions**: Supports US (global) and ES (Spain) trending feeds
- **Categories**: Includes Music, Gaming, and Technology categories
- **Search Functionality**: Client-side search through cached videos
- **Performance**: Fast loading from cache, minimizes API usage

## Setup Instructions

### 1. YouTube Data API v3

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**
4. Create an **API Key** credential
5. Add the API key to your `.env` file:

```bash
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### 2. Firebase Configuration

Ensure your Firebase project is configured with the following environment variables:

```bash
# Client-side Firebase config
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_web_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Server-side Firebase Admin (for cache updates)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
```

### 3. Firestore Security Rules

Update your `firestore.rules` to include the YouTube videos collection:

```javascript
// YouTube Videos Cache
match /youtube_videos/{videoId} {
  allow read: if true;
  allow write: if request.auth != null 
                && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
}
```

### 4. Scheduled Updates

Set up a cron job to update the cache every 24 hours:

#### Option A: Cloud Scheduler (Recommended)

Create a Cloud Scheduler job that calls the update endpoint:

```bash
# Endpoint: /api/youtube/update-cache
# Method: POST
# Headers: Authorization: Bearer YOUR_SECRET
# Schedule: 0 0 * * * (every day at midnight)
```

#### Option B: Local Cron Job

Add to your crontab:

```bash
0 0 * * * cd /path/to/portfolio-ios-repo && node scripts/youtube-cache-update.js
```

#### Option C: Manual Update

You can manually trigger updates by calling:

```bash
curl -X POST -H "Authorization: Bearer YOUR_SECRET" https://your-domain.com/api/youtube/update-cache
```

## API Endpoints

### `GET/POST /api/youtube/update-cache`

Updates the YouTube video cache. Requires authentication via `YOUTUBE_UPDATE_SECRET` environment variable.

## Files Modified

### New Files
- `src/lib/youtube-api.ts` - Server-side YouTube API integration
- `src/lib/youtube-client.ts` - Client-side video fetching
- `src/lib/firebase-client.ts` - Firebase client initialization
- `src/app/api/youtube/update-cache/route.ts` - Cache update API endpoint
- `src/components/apps/YoutubeReal.tsx` - New YouTube component with real data
- `scripts/youtube-cache-update.js` - Scheduled update script

### Modified Files
- `src/components/apps-developed/YoutubeApp.tsx` - Updated to use YoutubeReal
- `firestore.rules` - Added YouTube videos collection permissions
- `.env.example` - Added YouTube API and Firebase Admin configuration

## Data Flow

1. **Scheduled Update** (every 24 hours)
   - Fetches trending videos from YouTube API
   - Stores videos in Firestore with expiration timestamp
   - Updates multiple regions and categories

2. **Client Request**
   - App loads videos from Firestore cache
   - Search is performed client-side on cached data
   - Video player uses existing iframe implementation

3. **Cache Management**
   - Videos expire after 24 hours
   - Failed API calls fall back to existing cache
   - Automatic cleanup of expired entries

## Rate Limiting

The implementation is designed to stay within YouTube API quotas:
- **Maximum API calls/day**: ~200 (5 feeds × 20 videos × 2 updates)
- **Cache efficiency**: Reduces API calls by 95%+ for repeated searches
- **Error handling**: Graceful fallback to cached data

## Monitoring

Check the cache status by:

1. **Firestore Console**: Monitor the `youtube_videos` collection
2. **API Logs**: Check console for update job logs
3. **Client Performance**: Videos should load instantly from cache

## Troubleshooting

### Common Issues

1. **API Quota Exceeded**
   - Check your YouTube API quota in Google Cloud Console
   - Reduce update frequency if needed

2. **Firestore Permission Denied**
   - Verify Firebase Admin credentials
   - Check Firestore security rules

3. **Videos Not Loading**
   - Verify YouTube API key is correct
   - Check if cache update job is running
   - Verify Firebase configuration

### Debug Mode

Add `DEBUG_YOUTUBE=true` to your environment variables for detailed logging.

## Support

For issues with this integration, check:
- YouTube Data API v3 documentation
- Firebase Firestore documentation
- Project GitHub issues