-- ============================================================================
-- MIGRATION 016: ADVANCED PERSONALIZATION ENGINE
-- ============================================================================
-- Purpose: User interest profiling, preferences, collections, and personalization events
-- Features: Vectorial interest tracking, cold-start wizard, smart notifications,
--           'continue where you left off', explainability badges
-- Dependencies: 014_ai_taxonomy.sql (categories), 015_chain_matching.sql (matches)
-- Status: FULLY OFFLINE capable
-- ============================================================================

BEGIN;

-- ============================================================================
-- USER INTERESTS TABLE
-- ============================================================================
-- Tracks user interests in categories with scores (0-100)
-- Updated dynamically based on user behavior (views, searches, swaps)

CREATE TABLE IF NOT EXISTS user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  
  -- Interest scoring
  interest_score DECIMAL(5,2) NOT NULL DEFAULT 0.0 CHECK (interest_score BETWEEN 0 AND 100),
  confidence DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  
  -- Signal sources (how we learned this)
  from_onboarding BOOLEAN DEFAULT FALSE,
  from_objects_posted INTEGER DEFAULT 0,
  from_objects_viewed INTEGER DEFAULT 0,
  from_searches INTEGER DEFAULT 0,
  from_swaps_completed INTEGER DEFAULT 0,
  
  -- Temporal tracking
  first_signal_at TIMESTAMPTZ DEFAULT NOW(),
  last_signal_at TIMESTAMPTZ DEFAULT NOW(),
  decay_rate DECIMAL(4,3) DEFAULT 0.95, -- Interest decay over time
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, category_id)
);

-- Indexes for performance
CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX idx_user_interests_category_id ON user_interests(category_id);
CREATE INDEX idx_user_interests_score ON user_interests(interest_score DESC);
CREATE INDEX idx_user_interests_user_score ON user_interests(user_id, interest_score DESC);

-- RLS Policies
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interests"
  ON user_interests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own interests"
  ON user_interests FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- USER PREFERENCES TABLE
-- ============================================================================
-- Personalization settings and notification preferences

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification Preferences
  notify_new_matches BOOLEAN DEFAULT TRUE,
  notify_messages BOOLEAN DEFAULT TRUE,
  notify_swap_updates BOOLEAN DEFAULT TRUE,
  notify_promotions BOOLEAN DEFAULT FALSE,
  
  -- Quiet Hours (JSON format: [{start: "22:00", end: "08:00", days: [0,1,2,3,4,5,6]}])
  quiet_hours JSONB DEFAULT '[]'::jsonb,
  
  -- Preferred Categories (for prioritized notifications)
  preferred_categories UUID[] DEFAULT '{}',
  muted_categories UUID[] DEFAULT '{}',
  
  -- Feed Preferences
  feed_algorithm VARCHAR(50) DEFAULT 'balanced', -- 'balanced', 'popular', 'personalized', 'recent'
  show_nearby_first BOOLEAN DEFAULT TRUE,
  max_feed_distance_km INTEGER DEFAULT 500,
  
  -- Privacy Preferences
  show_location_publicly BOOLEAN DEFAULT TRUE,
  show_online_status BOOLEAN DEFAULT TRUE,
  allow_ai_recommendations BOOLEAN DEFAULT TRUE,
  
  -- Onboarding Status
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMPTZ,
  onboarding_skipped BOOLEAN DEFAULT FALSE,
  
  -- Continue Where You Left Off
  last_viewed_object_id UUID REFERENCES objects(id) ON DELETE SET NULL,
  last_viewed_at TIMESTAMPTZ,
  last_search_query TEXT,
  last_search_at TIMESTAMPTZ,
  
  -- UI Preferences
  language VARCHAR(10) DEFAULT 'ro',
  theme VARCHAR(20) DEFAULT 'system', -- 'light', 'dark', 'system'
  compact_view BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- RLS Policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- USER COLLECTIONS TABLE
-- ============================================================================
-- User-created collections for organizing favorite objects

CREATE TABLE IF NOT EXISTS user_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Collection Details
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- lucide-react icon name
  color VARCHAR(7), -- hex color
  
  -- Contents
  object_ids UUID[] DEFAULT '{}',
  object_count INTEGER DEFAULT 0,
  
  -- Sharing
  is_public BOOLEAN DEFAULT FALSE,
  shared_with UUID[] DEFAULT '{}', -- user IDs
  
  -- Auto-Collection Settings (AI-generated)
  is_auto_collection BOOLEAN DEFAULT FALSE,
  auto_criteria JSONB, -- {category_ids: [], min_value: 100, ...}
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_collections_user_id ON user_collections(user_id);
CREATE INDEX idx_user_collections_public ON user_collections(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_user_collections_object_ids ON user_collections USING GIN(object_ids);

-- RLS Policies
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections"
  ON user_collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collections"
  ON user_collections FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "Users can view shared collections"
  ON user_collections FOR SELECT
  USING (auth.uid() = ANY(shared_with));

CREATE POLICY "Users can manage own collections"
  ON user_collections FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- PERSONALIZATION EVENTS TABLE
-- ============================================================================
-- Track user interactions for learning preferences

CREATE TABLE IF NOT EXISTS personalization_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Event Type
  event_type VARCHAR(50) NOT NULL,
  -- Types: 'object_view', 'object_like', 'search', 'category_browse',
  --        'match_accept', 'swap_complete', 'collection_add', 'onboarding_answer'
  
  -- Event Context
  object_id UUID REFERENCES objects(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  search_query TEXT,
  
  -- Event Data (flexible JSONB for different event types)
  event_data JSONB DEFAULT '{}'::jsonb,
  
  -- Signals Extracted
  interest_signals JSONB DEFAULT '{}'::jsonb,
  -- Example: {"categories": ["uuid1", "uuid2"], "keywords": ["laptop", "gaming"], "price_range": [500, 1000]}
  
  -- Session Tracking
  session_id UUID,
  time_spent_seconds INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX idx_personalization_events_user_id ON personalization_events(user_id);
CREATE INDEX idx_personalization_events_type ON personalization_events(event_type);
CREATE INDEX idx_personalization_events_created_at ON personalization_events(created_at DESC);
CREATE INDEX idx_personalization_events_user_created ON personalization_events(user_id, created_at DESC);

-- Partial index for recent events (last 90 days)
CREATE INDEX idx_personalization_events_recent ON personalization_events(user_id, event_type)
WHERE created_at > NOW() - INTERVAL '90 days';

-- RLS Policies
ALTER TABLE personalization_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON personalization_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own events"
  ON personalization_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- COLD START ONBOARDING RESPONSES TABLE
-- ============================================================================
-- Store responses from 5-question onboarding wizard

CREATE TABLE IF NOT EXISTS onboarding_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Question 1: What brings you to Swaply?
  purpose VARCHAR(50), -- 'declutter', 'find_items', 'eco_friendly', 'save_money', 'community'
  
  -- Question 2: What categories interest you? (multi-select)
  interested_categories UUID[] DEFAULT '{}',
  
  -- Question 3: What's your typical item value range?
  value_range_min INTEGER,
  value_range_max INTEGER,
  
  -- Question 4: How far would you travel for a swap?
  max_distance_km INTEGER DEFAULT 50,
  
  -- Question 5: How often do you plan to swap?
  swap_frequency VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'occasionally'
  
  -- Additional Info
  discovered_via VARCHAR(50), -- 'search', 'social_media', 'friend', 'ad', 'other'
  additional_notes TEXT,
  
  -- Metadata
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_onboarding_responses_user_id ON onboarding_responses(user_id);

-- RLS Policies
ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding"
  ON onboarding_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own onboarding"
  ON onboarding_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FUNCTION: Update Interest Score
-- ----------------------------------------------------------------------------
-- Increments interest score based on signal type with decay over time

CREATE OR REPLACE FUNCTION update_interest_score(
  p_user_id UUID,
  p_category_id UUID,
  p_signal_type VARCHAR(50),
  p_increment DECIMAL(5,2) DEFAULT 5.0
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_new_score DECIMAL(5,2);
  v_days_since_last_signal INTEGER;
  v_decay_factor DECIMAL(4,3);
BEGIN
  -- Calculate decay based on time since last signal
  SELECT 
    EXTRACT(EPOCH FROM (NOW() - COALESCE(last_signal_at, NOW()))) / 86400,
    decay_rate
  INTO v_days_since_last_signal, v_decay_factor
  FROM user_interests
  WHERE user_id = p_user_id AND category_id = p_category_id;
  
  -- Apply decay if interest exists
  IF v_days_since_last_signal IS NOT NULL THEN
    v_decay_factor := POWER(COALESCE(v_decay_factor, 0.95), v_days_since_last_signal);
  ELSE
    v_decay_factor := 1.0;
  END IF;
  
  -- Upsert interest with decay and increment
  INSERT INTO user_interests (
    user_id,
    category_id,
    interest_score,
    from_onboarding,
    from_objects_posted,
    from_objects_viewed,
    from_searches,
    from_swaps_completed,
    last_signal_at
  ) VALUES (
    p_user_id,
    p_category_id,
    LEAST(100.0, p_increment),
    p_signal_type = 'onboarding',
    CASE WHEN p_signal_type = 'object_posted' THEN 1 ELSE 0 END,
    CASE WHEN p_signal_type = 'object_viewed' THEN 1 ELSE 0 END,
    CASE WHEN p_signal_type = 'search' THEN 1 ELSE 0 END,
    CASE WHEN p_signal_type = 'swap_completed' THEN 1 ELSE 0 END,
    NOW()
  )
  ON CONFLICT (user_id, category_id) DO UPDATE SET
    interest_score = LEAST(100.0, (user_interests.interest_score * v_decay_factor) + p_increment),
    from_objects_posted = user_interests.from_objects_posted + 
      CASE WHEN p_signal_type = 'object_posted' THEN 1 ELSE 0 END,
    from_objects_viewed = user_interests.from_objects_viewed + 
      CASE WHEN p_signal_type = 'object_viewed' THEN 1 ELSE 0 END,
    from_searches = user_interests.from_searches + 
      CASE WHEN p_signal_type = 'search' THEN 1 ELSE 0 END,
    from_swaps_completed = user_interests.from_swaps_completed + 
      CASE WHEN p_signal_type = 'swap_completed' THEN 1 ELSE 0 END,
    last_signal_at = NOW(),
    updated_at = NOW()
  RETURNING interest_score INTO v_new_score;
  
  RETURN v_new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- FUNCTION: Get Personalized Recommendations
-- ----------------------------------------------------------------------------
-- Returns recommended objects based on user interests

CREATE OR REPLACE FUNCTION get_personalized_recommendations(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_exclude_own BOOLEAN DEFAULT TRUE
) RETURNS TABLE (
  object_id UUID,
  title VARCHAR(200),
  category_id UUID,
  interest_score DECIMAL(5,2),
  match_score DECIMAL(5,2),
  match_reasons TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id AS object_id,
    o.title,
    o.category_id,
    COALESCE(ui.interest_score, 0.0) AS interest_score,
    (
      COALESCE(ui.interest_score, 0.0) * 0.5 + -- Interest weight: 50%
      CASE 
        WHEN calculate_distance(u1.latitude, u1.longitude, u2.latitude, u2.longitude) < 50 THEN 100
        WHEN calculate_distance(u1.latitude, u1.longitude, u2.latitude, u2.longitude) < 100 THEN 80
        WHEN calculate_distance(u1.latitude, u1.longitude, u2.latitude, u2.longitude) < 200 THEN 60
        ELSE 40
      END * 0.3 + -- Proximity weight: 30%
      COALESCE(u2.trust_score, 50) * 0.2 -- Reputation weight: 20%
    ) AS match_score,
    ARRAY[
      CASE WHEN COALESCE(ui.interest_score, 0) > 70 THEN 'Strongly matches your interests' END,
      CASE WHEN COALESCE(ui.interest_score, 0) BETWEEN 40 AND 70 THEN 'Matches your interests' END,
      CASE WHEN calculate_distance(u1.latitude, u1.longitude, u2.latitude, u2.longitude) < 50 THEN 'Very close to you' END,
      CASE WHEN calculate_distance(u1.latitude, u1.longitude, u2.latitude, u2.longitude) BETWEEN 50 AND 100 THEN 'Nearby' END,
      CASE WHEN u2.trust_score > 80 THEN 'Highly trusted user' END,
      CASE WHEN o.created_at > NOW() - INTERVAL '7 days' THEN 'Recently posted' END
    ]::TEXT[] AS match_reasons
  FROM objects o
  JOIN users u2 ON o.user_id = u2.id
  CROSS JOIN users u1
  LEFT JOIN user_interests ui ON ui.user_id = p_user_id AND ui.category_id = o.category_id
  WHERE 
    u1.id = p_user_id
    AND o.status = 'available'
    AND (NOT p_exclude_own OR o.user_id != p_user_id)
    AND o.deleted_at IS NULL
  ORDER BY match_score DESC, o.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- FUNCTION: Get User Interest Summary
-- ----------------------------------------------------------------------------
-- Returns top interests with explainability

CREATE OR REPLACE FUNCTION get_user_interest_summary(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  category_id UUID,
  category_name VARCHAR(100),
  interest_score DECIMAL(5,2),
  confidence DECIMAL(3,2),
  signal_sources JSONB,
  last_signal_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ui.category_id,
    c.name_en AS category_name,
    ui.interest_score,
    ui.confidence,
    jsonb_build_object(
      'onboarding', ui.from_onboarding,
      'posted', ui.from_objects_posted,
      'viewed', ui.from_objects_viewed,
      'searches', ui.from_searches,
      'swaps', ui.from_swaps_completed
    ) AS signal_sources,
    ui.last_signal_at
  FROM user_interests ui
  JOIN categories c ON ui.category_id = c.id
  WHERE ui.user_id = p_user_id
  ORDER BY ui.interest_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- FUNCTION: Check If In Quiet Hours
-- ----------------------------------------------------------------------------
-- Checks if current time is within user's quiet hours

CREATE OR REPLACE FUNCTION is_in_quiet_hours(
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_quiet_hours JSONB;
  v_current_time TIME;
  v_current_day INTEGER; -- 0=Sunday, 6=Saturday
  v_quiet_period JSONB;
BEGIN
  -- Get user's quiet hours
  SELECT quiet_hours INTO v_quiet_hours
  FROM user_preferences
  WHERE user_id = p_user_id;
  
  -- No quiet hours configured
  IF v_quiet_hours IS NULL OR jsonb_array_length(v_quiet_hours) = 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Get current time and day
  v_current_time := LOCALTIME;
  v_current_day := EXTRACT(DOW FROM NOW());
  
  -- Check each quiet period
  FOR v_quiet_period IN SELECT * FROM jsonb_array_elements(v_quiet_hours)
  LOOP
    -- Check if current day is in the period's days array
    IF v_quiet_period->'days' @> to_jsonb(v_current_day) THEN
      -- Check if current time is within the period
      IF v_current_time BETWEEN 
         (v_quiet_period->>'start')::TIME AND 
         (v_quiet_period->>'end')::TIME 
      THEN
        RETURN TRUE;
      END IF;
    END IF;
  END LOOP;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- FUNCTION: Process Onboarding Responses
-- ----------------------------------------------------------------------------
-- Converts onboarding answers into initial interests

CREATE OR REPLACE FUNCTION process_onboarding_responses(
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_response RECORD;
  v_category_id UUID;
  v_interests_created INTEGER := 0;
BEGIN
  -- Get onboarding responses
  SELECT * INTO v_response
  FROM onboarding_responses
  WHERE user_id = p_user_id;
  
  -- No responses found
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Create interests from selected categories with high initial score
  FOREACH v_category_id IN ARRAY v_response.interested_categories
  LOOP
    PERFORM update_interest_score(
      p_user_id,
      v_category_id,
      'onboarding',
      60.0 -- Strong initial signal
    );
    v_interests_created := v_interests_created + 1;
  END LOOP;
  
  -- Update user preferences based on onboarding
  INSERT INTO user_preferences (
    user_id,
    onboarding_completed,
    onboarding_completed_at,
    max_feed_distance_km
  ) VALUES (
    p_user_id,
    TRUE,
    NOW(),
    COALESCE(v_response.max_distance_km, 500)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    onboarding_completed = TRUE,
    onboarding_completed_at = NOW(),
    max_feed_distance_km = COALESCE(v_response.max_distance_km, user_preferences.max_feed_distance_km),
    updated_at = NOW();
  
  RETURN v_interests_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- FUNCTION: Get Continue Where You Left Off
-- ----------------------------------------------------------------------------
-- Returns context for user to resume their activity

CREATE OR REPLACE FUNCTION get_continue_context(
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_context JSONB;
  v_prefs RECORD;
BEGIN
  -- Get user preferences
  SELECT * INTO v_prefs
  FROM user_preferences
  WHERE user_id = p_user_id;
  
  -- No preferences found
  IF NOT FOUND THEN
    RETURN '{}'::jsonb;
  END IF;
  
  -- Build context
  v_context := jsonb_build_object(
    'last_viewed_object', jsonb_build_object(
      'id', v_prefs.last_viewed_object_id,
      'viewed_at', v_prefs.last_viewed_at
    ),
    'last_search', jsonb_build_object(
      'query', v_prefs.last_search_query,
      'searched_at', v_prefs.last_search_at
    ),
    'has_context', (
      v_prefs.last_viewed_object_id IS NOT NULL OR 
      v_prefs.last_search_query IS NOT NULL
    )
  );
  
  RETURN v_context;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active User Interests View
CREATE OR REPLACE VIEW active_user_interests AS
SELECT 
  ui.user_id,
  ui.category_id,
  c.name_en AS category_name,
  c.icon_name,
  ui.interest_score,
  ui.confidence,
  ui.last_signal_at,
  EXTRACT(EPOCH FROM (NOW() - ui.last_signal_at)) / 86400 AS days_since_signal
FROM user_interests ui
JOIN categories c ON ui.category_id = c.id
WHERE ui.interest_score > 20.0 -- Minimum threshold for active interest
ORDER BY ui.user_id, ui.interest_score DESC;

-- User Collections Summary View
CREATE OR REPLACE VIEW user_collections_summary AS
SELECT 
  uc.user_id,
  COUNT(*) AS total_collections,
  SUM(uc.object_count) AS total_objects_in_collections,
  COUNT(*) FILTER (WHERE uc.is_public) AS public_collections,
  COUNT(*) FILTER (WHERE uc.is_auto_collection) AS auto_collections
FROM user_collections uc
GROUP BY uc.user_id;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update object_count in collections
CREATE OR REPLACE FUNCTION update_collection_object_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.object_count := array_length(NEW.object_ids, 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_collection_count
  BEFORE INSERT OR UPDATE OF object_ids ON user_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_object_count();

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_personalization_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_interests_updated_at
  BEFORE UPDATE ON user_interests
  FOR EACH ROW
  EXECUTE FUNCTION update_personalization_updated_at();

CREATE TRIGGER trigger_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_personalization_updated_at();

CREATE TRIGGER trigger_user_collections_updated_at
  BEFORE UPDATE ON user_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_personalization_updated_at();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default preferences for existing users
INSERT INTO user_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- ANALYTICS HELPERS
-- ============================================================================

-- Get personalization adoption metrics
CREATE OR REPLACE VIEW personalization_adoption AS
SELECT 
  COUNT(DISTINCT up.user_id) AS users_with_preferences,
  COUNT(DISTINCT up.user_id) FILTER (WHERE up.onboarding_completed) AS completed_onboarding,
  COUNT(DISTINCT ui.user_id) AS users_with_interests,
  COUNT(DISTINCT uc.user_id) AS users_with_collections,
  AVG(ui_count.interest_count) AS avg_interests_per_user
FROM user_preferences up
LEFT JOIN user_interests ui ON up.user_id = ui.user_id
LEFT JOIN user_collections uc ON up.user_id = uc.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS interest_count
  FROM user_interests
  GROUP BY user_id
) ui_count ON up.user_id = ui_count.user_id;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Tables created: 5 (user_interests, user_preferences, user_collections, 
--                    personalization_events, onboarding_responses)
-- Functions created: 6 (update_interest_score, get_personalized_recommendations,
--                       get_user_interest_summary, is_in_quiet_hours,
--                       process_onboarding_responses, get_continue_context)
-- Views created: 3 (active_user_interests, user_collections_summary, personalization_adoption)
-- Triggers created: 4 (collection count, 3x updated_at)
-- ============================================================================
