-- =============================================
-- Admin Dashboard Views & Functions
-- =============================================
-- This migration creates database views and functions
-- to efficiently aggregate statistics for the admin dashboard.
-- 
-- Created: 2024
-- Purpose: Admin monitoring and analytics

-- =============================================
-- 1. ADMIN STATS OVERVIEW VIEW
-- =============================================
-- Provides quick access to key platform metrics

CREATE OR REPLACE VIEW admin_stats_overview AS
SELECT
  -- User metrics
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') as new_users_this_week,
  (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days') as new_users_this_month,
  (SELECT COUNT(*) FROM users WHERE last_sign_in_at > NOW() - INTERVAL '7 days') as active_users_this_week,
  
  -- Object metrics
  (SELECT COUNT(*) FROM objects WHERE status = 'available') as available_objects,
  (SELECT COUNT(*) FROM objects WHERE created_at > NOW() - INTERVAL '7 days') as new_objects_this_week,
  (SELECT COUNT(*) FROM objects) as total_objects,
  
  -- Swap metrics
  (SELECT COUNT(*) FROM swap_requests WHERE status = 'pending') as pending_swap_requests,
  (SELECT COUNT(*) FROM swap_requests WHERE status = 'accepted') as accepted_swap_requests,
  (SELECT COUNT(*) FROM swap_requests WHERE status = 'completed') as completed_swaps_total,
  (SELECT COUNT(*) FROM swap_requests WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '7 days') as completed_swaps_this_week,
  (SELECT COUNT(*) FROM swap_requests WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '30 days') as completed_swaps_this_month,
  (SELECT COUNT(*) FROM swap_requests WHERE status = 'rejected') as rejected_swap_requests,
  
  -- Rating metrics
  (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews) as average_rating,
  (SELECT COUNT(*) FROM reviews) as total_reviews,
  (SELECT COUNT(*) FROM reviews WHERE created_at > NOW() - INTERVAL '7 days') as reviews_this_week,
  
  -- Notification metrics
  (SELECT COUNT(*) FROM notifications WHERE read = false) as unread_notifications,
  (SELECT COUNT(*) FROM notifications WHERE created_at > NOW() - INTERVAL '24 hours') as notifications_today;

-- Grant access to authenticated users (admin check will be in middleware)
GRANT SELECT ON admin_stats_overview TO authenticated;

-- =============================================
-- 2. USER ACTIVITY VIEW
-- =============================================
-- Shows most active users with their contributions

CREATE OR REPLACE VIEW admin_user_activity AS
SELECT
  u.id,
  u.email,
  u.full_name,
  u.created_at as joined_at,
  u.last_sign_in_at,
  COALESCE(obj_count.total, 0) as total_objects,
  COALESCE(swap_count.total, 0) as total_swaps,
  COALESCE(review_count.total, 0) as total_reviews,
  COALESCE(AVG(r.rating), 0)::numeric(3,2) as average_rating_received,
  COALESCE(achievements.count, 0) as achievement_count
FROM users u
LEFT JOIN (
  SELECT user_id, COUNT(*) as total
  FROM objects
  GROUP BY user_id
) obj_count ON u.id = obj_count.user_id
LEFT JOIN (
  SELECT requester_id as user_id, COUNT(*) as total
  FROM swap_requests
  WHERE status = 'completed'
  GROUP BY requester_id
  UNION ALL
  SELECT owner_id as user_id, COUNT(*) as total
  FROM swap_requests
  WHERE status = 'completed'
  GROUP BY owner_id
) swap_count ON u.id = swap_count.user_id
LEFT JOIN (
  SELECT reviewer_id as user_id, COUNT(*) as total
  FROM reviews
  GROUP BY reviewer_id
) review_count ON u.id = review_count.user_id
LEFT JOIN reviews r ON u.id = r.reviewee_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM user_achievements
  GROUP BY user_id
) achievements ON u.id = achievements.user_id
GROUP BY 
  u.id, 
  u.email, 
  u.full_name, 
  u.created_at, 
  u.last_sign_in_at, 
  obj_count.total, 
  swap_count.total, 
  review_count.total,
  achievements.count
ORDER BY total_swaps DESC, average_rating_received DESC
LIMIT 100;

-- Grant access to authenticated users
GRANT SELECT ON admin_user_activity TO authenticated;

-- =============================================
-- 3. SWAP TRENDS VIEW
-- =============================================
-- Daily swap statistics for charts

CREATE OR REPLACE VIEW admin_swap_trends AS
SELECT
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  COUNT(*) as total_count
FROM swap_requests
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Grant access to authenticated users
GRANT SELECT ON admin_swap_trends TO authenticated;

-- =============================================
-- 4. CATEGORY DISTRIBUTION VIEW
-- =============================================
-- Object distribution by category

CREATE OR REPLACE VIEW admin_category_distribution AS
SELECT
  category,
  COUNT(*) as object_count,
  COUNT(*) FILTER (WHERE status = 'available') as available_count,
  COUNT(*) FILTER (WHERE status = 'swapped') as swapped_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM objects
GROUP BY category
ORDER BY object_count DESC;

-- Grant access to authenticated users
GRANT SELECT ON admin_category_distribution TO authenticated;

-- =============================================
-- 5. RECENT ACTIVITY VIEW
-- =============================================
-- Latest platform activity (last 100 events)

CREATE OR REPLACE VIEW admin_recent_activity AS
(
  SELECT
    'user_signup' as event_type,
    u.id as entity_id,
    u.full_name as description,
    u.created_at as timestamp,
    json_build_object('email', u.email, 'full_name', u.full_name) as metadata
  FROM users u
  ORDER BY u.created_at DESC
  LIMIT 20
)
UNION ALL
(
  SELECT
    'object_created' as event_type,
    o.id as entity_id,
    o.title as description,
    o.created_at as timestamp,
    json_build_object('category', o.category, 'location', o.location, 'user_id', o.user_id) as metadata
  FROM objects o
  ORDER BY o.created_at DESC
  LIMIT 20
)
UNION ALL
(
  SELECT
    'swap_completed' as event_type,
    sr.id as entity_id,
    'Swap completed' as description,
    sr.completed_at as timestamp,
    json_build_object('requester_id', sr.requester_id, 'owner_id', sr.owner_id, 'status', sr.status) as metadata
  FROM swap_requests sr
  WHERE sr.status = 'completed'
  ORDER BY sr.completed_at DESC
  LIMIT 20
)
UNION ALL
(
  SELECT
    'review_posted' as event_type,
    r.id as entity_id,
    CAST(r.rating as TEXT) || ' stars' as description,
    r.created_at as timestamp,
    json_build_object('reviewer_id', r.reviewer_id, 'reviewee_id', r.reviewee_id, 'rating', r.rating) as metadata
  FROM reviews r
  ORDER BY r.created_at DESC
  LIMIT 20
)
ORDER BY timestamp DESC
LIMIT 100;

-- Grant access to authenticated users
GRANT SELECT ON admin_recent_activity TO authenticated;

-- =============================================
-- 6. TOP USERS FUNCTION
-- =============================================
-- Flexible function to get top users by various metrics

CREATE OR REPLACE FUNCTION get_top_users(
  metric_type TEXT DEFAULT 'rating',
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  metric_value NUMERIC,
  metric_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  CASE metric_type
    WHEN 'rating' THEN
      SELECT
        u.id,
        u.email,
        u.full_name,
        COALESCE(AVG(r.rating), 0)::numeric(4,2) as metric_value,
        'Average Rating'::TEXT as metric_name
      FROM users u
      LEFT JOIN reviews r ON u.id = r.reviewee_id
      GROUP BY u.id, u.email, u.full_name
      HAVING COUNT(r.id) >= 3  -- At least 3 reviews
      ORDER BY metric_value DESC
      LIMIT limit_count
    
    WHEN 'swaps' THEN
      SELECT
        u.id,
        u.email,
        u.full_name,
        COUNT(DISTINCT sr.id)::numeric as metric_value,
        'Total Swaps'::TEXT as metric_name
      FROM users u
      LEFT JOIN swap_requests sr ON u.id IN (sr.requester_id, sr.owner_id)
        AND sr.status = 'completed'
      GROUP BY u.id, u.email, u.full_name
      ORDER BY metric_value DESC
      LIMIT limit_count
    
    WHEN 'objects' THEN
      SELECT
        u.id,
        u.email,
        u.full_name,
        COUNT(o.id)::numeric as metric_value,
        'Total Objects'::TEXT as metric_name
      FROM users u
      LEFT JOIN objects o ON u.id = o.user_id
      GROUP BY u.id, u.email, u.full_name
      ORDER BY metric_value DESC
      LIMIT limit_count
    
    WHEN 'reviews' THEN
      SELECT
        u.id,
        u.email,
        u.full_name,
        COUNT(r.id)::numeric as metric_value,
        'Total Reviews'::TEXT as metric_name
      FROM users u
      LEFT JOIN reviews r ON u.id = r.reviewer_id
      GROUP BY u.id, u.email, u.full_name
      ORDER BY metric_value DESC
      LIMIT limit_count
    
    ELSE
      -- Default: rating
      SELECT
        u.id,
        u.email,
        u.full_name,
        COALESCE(AVG(r.rating), 0)::numeric(4,2) as metric_value,
        'Average Rating'::TEXT as metric_name
      FROM users u
      LEFT JOIN reviews r ON u.id = r.reviewee_id
      GROUP BY u.id, u.email, u.full_name
      HAVING COUNT(r.id) >= 3
      ORDER BY metric_value DESC
      LIMIT limit_count
  END;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_top_users(TEXT, INT) TO authenticated;

-- =============================================
-- 7. GROWTH METRICS FUNCTION
-- =============================================
-- Calculate growth rates for various metrics

CREATE OR REPLACE FUNCTION get_growth_metrics(
  period_days INT DEFAULT 30
)
RETURNS TABLE (
  metric_name TEXT,
  current_value BIGINT,
  previous_value BIGINT,
  growth_rate NUMERIC,
  growth_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH metrics AS (
    SELECT
      'Users' as name,
      COUNT(*) FILTER (WHERE created_at > NOW() - (period_days || ' days')::INTERVAL) as current_val,
      COUNT(*) FILTER (WHERE created_at BETWEEN NOW() - (period_days * 2 || ' days')::INTERVAL AND NOW() - (period_days || ' days')::INTERVAL) as previous_val
    FROM users
    
    UNION ALL
    
    SELECT
      'Objects' as name,
      COUNT(*) FILTER (WHERE created_at > NOW() - (period_days || ' days')::INTERVAL),
      COUNT(*) FILTER (WHERE created_at BETWEEN NOW() - (period_days * 2 || ' days')::INTERVAL AND NOW() - (period_days || ' days')::INTERVAL)
    FROM objects
    
    UNION ALL
    
    SELECT
      'Completed Swaps' as name,
      COUNT(*) FILTER (WHERE completed_at > NOW() - (period_days || ' days')::INTERVAL),
      COUNT(*) FILTER (WHERE completed_at BETWEEN NOW() - (period_days * 2 || ' days')::INTERVAL AND NOW() - (period_days || ' days')::INTERVAL)
    FROM swap_requests
    WHERE status = 'completed'
    
    UNION ALL
    
    SELECT
      'Reviews' as name,
      COUNT(*) FILTER (WHERE created_at > NOW() - (period_days || ' days')::INTERVAL),
      COUNT(*) FILTER (WHERE created_at BETWEEN NOW() - (period_days * 2 || ' days')::INTERVAL AND NOW() - (period_days || ' days')::INTERVAL)
    FROM reviews
  )
  SELECT
    name as metric_name,
    current_val as current_value,
    previous_val as previous_value,
    CASE
      WHEN previous_val = 0 THEN 100.0
      ELSE ROUND((current_val - previous_val) * 100.0 / previous_val, 2)
    END as growth_rate,
    (current_val - previous_val) as growth_count
  FROM metrics;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_growth_metrics(INT) TO authenticated;

-- =============================================
-- 8. COMMENTS & INDEXES
-- =============================================

COMMENT ON VIEW admin_stats_overview IS 'Quick overview of all platform statistics';
COMMENT ON VIEW admin_user_activity IS 'Top 100 most active users with their contributions';
COMMENT ON VIEW admin_swap_trends IS 'Daily swap counts by status (last 30 days)';
COMMENT ON VIEW admin_category_distribution IS 'Object count by category with percentages';
COMMENT ON VIEW admin_recent_activity IS 'Latest 100 platform events across all tables';
COMMENT ON FUNCTION get_top_users IS 'Get top N users by metric (rating/swaps/objects/reviews)';
COMMENT ON FUNCTION get_growth_metrics IS 'Calculate growth rates for key metrics over period';
