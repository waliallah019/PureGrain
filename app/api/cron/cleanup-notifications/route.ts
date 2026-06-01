// my-leather-platform/app/api/cron/cleanup-notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/config/db';
import notificationService from '@/lib/services/notificationService';
import logger from '@/lib/config/logger';

// IMPORTANT: Define this in your Vercel project's Environment Variables (e.g., as NOTIFICATION_CLEANUP_CRON_SECRET)
// And use it in your vercel.json cron job config.
const CRON_SECRET = process.env.NOTIFICATION_CLEANUP_CRON_SECRET;
const DAYS_TO_KEEP_NOTIFICATIONS = 7; // Define how many days to keep notifications

export const dynamic = 'force-dynamic'; // Ensure this route is always a serverless function

export async function GET(req: NextRequest) {
  // Security check: Only allow access if the secret is provided and matches
  const authHeader = req.headers.get('Authorization');

  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    logger.warn('Unauthorized access attempt to /api/cron/cleanup-notifications');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await connectDB(); // Ensure DB connection is established for the cron job

  try {
    logger.info(`Starting notification cleanup for notifications older than ${DAYS_TO_KEEP_NOTIFICATIONS} days.`);
    const deletedCount = await notificationService.deleteOldNotifications(DAYS_TO_KEEP_NOTIFICATIONS);
    logger.info(`Successfully deleted ${deletedCount} old notifications.`);

    return NextResponse.json({ success: true, message: `Cleanup completed. Deleted ${deletedCount} notifications.` });
  } catch (error: any) {
    logger.error('Error during notification cleanup cron job:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to perform notification cleanup.', error: error.message },
      { status: 500 }
    );
  }
}