import { NextRequest, NextResponse } from 'next/server';
import { updateYouTubeVideos } from '@/lib/youtube-api';

export const runtime = 'nodejs';

/**
 * API endpoint to manually trigger YouTube cache update
 * Protected with basic auth secret
 */
export async function GET(req: NextRequest) {
  // Check for authorization secret
  const authHeader = req.headers.get('authorization');
  const expectedSecret = process.env.YOUTUBE_UPDATE_SECRET;
  
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('Manual YouTube cache update triggered via API');
    await updateYouTubeVideos();
    
    return NextResponse.json({
      success: true,
      message: 'YouTube cache updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating YouTube cache:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update YouTube cache'
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for scheduled updates (cloud scheduler, cron jobs)
 */
export async function POST(req: NextRequest) {
  // Check for authorization secret
  const authHeader = req.headers.get('authorization');
  const expectedSecret = process.env.YOUTUBE_UPDATE_SECRET;
  
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('Scheduled YouTube cache update triggered');
    await updateYouTubeVideos();
    
    return NextResponse.json({
      success: true,
      message: 'YouTube cache updated successfully via scheduled job'
    });
  } catch (error: any) {
    console.error('Error updating YouTube cache:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update YouTube cache'
      },
      { status: 500 }
    );
  }
}