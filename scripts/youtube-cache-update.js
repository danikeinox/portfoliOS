#!/usr/bin/env node
/**
 * YouTube cache update script
 * To be run as a cron job (every 24 hours)
 */

import { updateYouTubeVideos } from '../src/lib/youtube-api.js';

async function main() {
  console.log('🚀 Starting scheduled YouTube cache update...');
  
  try {
    await updateYouTubeVideos();
    console.log('✅ YouTube cache updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to update YouTube cache:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;