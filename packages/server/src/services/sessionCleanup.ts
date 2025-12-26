import cron from 'node-cron';
import { cleanupInactiveSessions } from './sessions.js';

export function startSessionCleanup() {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Running session cleanup...');
      const endedSessions = await cleanupInactiveSessions();
      if (endedSessions.length > 0) {
        console.log(`Ended ${endedSessions.length} inactive sessions`);
      }
    } catch (error) {
      console.error('Error in session cleanup:', error);
    }
  });

  console.log('Session cleanup cron job started (runs every hour)');
}
