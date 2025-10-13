-- Rating Reminder System
-- Automatically sends notifications to users 24h after swap completion
-- to remind them to rate their swap experience

-- Function to find completed swaps without reviews (older than 24h)
-- and send rating reminders
CREATE OR REPLACE FUNCTION send_rating_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_swap_record RECORD;
  v_reminder_count INTEGER := 0;
BEGIN
  -- Find swaps that:
  -- 1. Were completed more than 24 hours ago
  -- 2. Don't have a review from one or both parties
  -- 3. Haven't had a rating reminder sent yet (check notifications table)
  
  FOR v_swap_record IN
    SELECT 
      sr.id as swap_id,
      sr.requester_id,
      sr.owner_id,
      sr.status,
      sr.completed_at,
      req_obj.title as requester_object_name,
      own_obj.title as owner_object_name,
      req_user.full_name as requester_name,
      own_user.full_name as owner_name
    FROM swap_requests sr
    JOIN objects req_obj ON sr.requester_object_id = req_obj.id
    JOIN objects own_obj ON sr.owner_object_id = own_obj.id
    JOIN users req_user ON sr.requester_id = req_user.id
    JOIN users own_user ON sr.owner_id = own_user.id
    WHERE sr.status = 'completed'
      AND sr.completed_at IS NOT NULL
      AND sr.completed_at < NOW() - INTERVAL '24 hours'
      AND sr.completed_at > NOW() - INTERVAL '7 days' -- Only send reminders for recent swaps
  LOOP
    -- Check if requester needs reminder (no review + no existing reminder notification)
    IF NOT EXISTS (
      SELECT 1 FROM reviews 
      WHERE swap_request_id = v_swap_record.swap_id 
      AND reviewer_id = v_swap_record.requester_id
    ) AND NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = v_swap_record.requester_id
      AND type = 'rating'
      AND data->>'swapId' = v_swap_record.swap_id::TEXT
      AND created_at > NOW() - INTERVAL '7 days'
    ) THEN
      -- Send reminder to requester
      INSERT INTO notifications (user_id, title, message, type, data, read)
      VALUES (
        v_swap_record.requester_id,
        'Evaluează experiența ⭐',
        'Cum a fost schimbul cu ' || v_swap_record.owner_name || ' pentru "' || v_swap_record.owner_object_name || '"? Lasă o evaluare pentru a ajuta comunitatea.',
        'rating',
        jsonb_build_object(
          'swapId', v_swap_record.swap_id,
          'swapPartner', v_swap_record.owner_name,
          'objectName', v_swap_record.owner_object_name
        ),
        FALSE
      );
      v_reminder_count := v_reminder_count + 1;
    END IF;
    
    -- Check if owner needs reminder (no review + no existing reminder notification)
    IF NOT EXISTS (
      SELECT 1 FROM reviews 
      WHERE swap_request_id = v_swap_record.swap_id 
      AND reviewer_id = v_swap_record.owner_id
    ) AND NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = v_swap_record.owner_id
      AND type = 'rating'
      AND data->>'swapId' = v_swap_record.swap_id::TEXT
      AND created_at > NOW() - INTERVAL '7 days'
    ) THEN
      -- Send reminder to owner
      INSERT INTO notifications (user_id, title, message, type, data, read)
      VALUES (
        v_swap_record.owner_id,
        'Evaluează experiența ⭐',
        'Cum a fost schimbul cu ' || v_swap_record.requester_name || ' pentru "' || v_swap_record.requester_object_name || '"? Lasă o evaluare pentru a ajuta comunitatea.',
        'rating',
        jsonb_build_object(
          'swapId', v_swap_record.swap_id,
          'swapPartner', v_swap_record.requester_name,
          'objectName', v_swap_record.requester_object_name
        ),
        FALSE
      );
      v_reminder_count := v_reminder_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_reminder_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION send_rating_reminders() TO authenticated;

COMMENT ON FUNCTION send_rating_reminders IS 'Sends rating reminders for completed swaps without reviews (24h+ old, max 7 days)';

-- Create a pg_cron job to run this function every 6 hours
-- NOTE: Requires pg_cron extension enabled on database
-- Run this in Supabase Dashboard SQL Editor:

/*
-- Enable pg_cron extension (only needed once)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule rating reminders to run every 6 hours
SELECT cron.schedule(
  'rating-reminders-job',
  '0 */6 * * *', -- Every 6 hours
  $$SELECT send_rating_reminders();$$
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- Unschedule job (if needed)
-- SELECT cron.unschedule('rating-reminders-job');
*/

-- Alternative: Create trigger to check on swap completion (immediate reminder after 24h)
-- This approach uses a background worker or cron job instead

-- Manual testing query
-- Call this to test the function:
-- SELECT send_rating_reminders();
