import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

/**
 * API Route: Send Rating Reminders
 * 
 * Finds completed swaps without reviews and sends reminder notifications
 * 
 * This route should be called by:
 * 1. Vercel Cron Job (every 6 hours)
 * 2. Manual trigger for testing
 * 
 * Security: Protected by CRON_SECRET environment variable
 * 
 * @example
 * // Vercel Cron Job
 * GET /api/cron/rating-reminders
 * Headers: { Authorization: Bearer CRON_SECRET }
 * 
 * // Manual testing (in development)
 * GET /api/cron/rating-reminders?manual=true
 */
export async function GET(request: Request) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const isManual = searchParams.get('manual') === 'true';

    // In production, require CRON_SECRET
    if (process.env.NODE_ENV === 'production' && !isManual) {
      const token = authHeader?.replace('Bearer ', '');
      const cronSecret = process.env.CRON_SECRET;

      if (!cronSecret || token !== cronSecret) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Get Supabase instance
    const supabase = await getServerSupabase();

    // Call the rating reminders function
    const { data, error } = await supabase.rpc('send_rating_reminders');

    if (error) {
      console.error('Error sending rating reminders:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          remindersSent: 0,
        },
        { status: 500 }
      );
    }

    const reminderCount = data || 0;

    console.log(`✅ Rating reminders sent: ${reminderCount}`);

    return NextResponse.json({
      success: true,
      remindersSent: reminderCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Unexpected error in rating reminders cron:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        remindersSent: 0,
      },
      { status: 500 }
    );
  }
}

// Prevent static optimization (required for dynamic routes)
export const dynamic = 'force-dynamic';
export const revalidate = 0;
